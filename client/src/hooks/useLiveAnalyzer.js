import { useCallback, useEffect, useRef, useState } from 'react'
import { detectVoice } from '../api/client.js'
import {LIVE_SEGMENT_SECONDS, TARGET_SAMPLE_RATE, MAX_INFLIGHT_SEGMENTS, MAX_SESSION_SECONDS}from '../config/env.js'
import { blobToBase64, concatFloat32, downsample, encodeWav, peak, rms} from '../utils/wav.js'
import { isAi } from '../utils/format.js'

const SILENCE_RMS = 0.006
/// s server-side sliding window needs meaningful audio; don't send scraps
const MIN_TAIL_SECONDS = 2
/**
 * Cap on the audio sent for the end-of-session verdict. CPU inference runs at
 * roughly 1x real time, so this must stay well inside REQUEST_TIMEOUT_MS —
 * only the most recent MAX_SESSION_SECONDS are scored.
 */
const MAX_FULL_SECONDS = MAX_SESSION_SECONDS

const supported =
  typeof window !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  Boolean(window.AudioContext || window.webkitAudioContext)

/**
 * Converts a verdict into a single 0..1 "AI likelihood" so successive segments
 * plot on one axis. HUMAN at 90% confidence becomes 0.10 likelihood.
 */
export function toAiLikelihood(classification, confidenceScore) {
  const c = Math.max(0, Math.min(1, Number(confidenceScore) || 0))
  return isAi(classification) ? c : 1 - c
}

export function useLiveAnalyzer({ language = 'English', onFinal } = {}) {
  const [status, setStatus] = useState('idle') // idle | starting | running | finalizing
  const [points, setPoints] = useState([])
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [pending, setPending] = useState(0)
  const [finalResult, setFinalResult] = useState(null)

  const ctxRef = useRef(null)
  const streamRef = useRef(null)
  const procRef = useRef(null)
  const sourceRef = useRef(null)
  const sinkRef = useRef(null)

  const segBufRef = useRef([]) // Float32Array[] @ TARGET_SAMPLE_RATE, current segment
  const segLenRef = useRef(0)
  const fullBufRef = useRef([]) // whole take, for the final verdict
  const fullLenRef = useRef(0)
  const segIndexRef = useRef(0)
  const inFlightRef = useRef(0)
  const abortRef = useRef(null)
  const timerRef = useRef(null)
  const langRef = useRef(language)
  const runningRef = useRef(false)

  useEffect(() => {
    langRef.current = language
  }, [language])

  const segmentSamples = Math.max(1, Math.round(LIVE_SEGMENT_SECONDS * TARGET_SAMPLE_RATE))

  const pushPoint = useCallback((point) => {
    setPoints((prev) => [...prev, point])
  }, [])

  /** Sends one already-downsampled Float32Array segment and plots the verdict. */
  const analyzeSegment = useCallback(
    async (samples, index, startedAt) => {
      const level = rms(samples)
      const base = {
        index,
        t: startedAt,
        label: `${startedAt}s`,
        level: Number(level.toFixed(4)),
        peak: Number(peak(samples).toFixed(4)),
      }

      if (level < SILENCE_RMS) {
        pushPoint({ ...base, ai: null, state: 'silent' })
        return
      }
      if (inFlightRef.current >= MAX_INFLIGHT_SEGMENTS) {
        pushPoint({ ...base, ai: null, state: 'skipped' })
        return
      }

      inFlightRef.current += 1
      setPending(inFlightRef.current)

      try {
        const wav = encodeWav(samples, TARGET_SAMPLE_RATE)
        const audioBase64 = await blobToBase64(wav)
        const res = await detectVoice(
          { audioBase64, language: langRef.current, audioFormat: 'wav' },
          { signal: abortRef.current?.signal },
        )
        const ai = toAiLikelihood(res.classification, res.confidenceScore)
        pushPoint({
          ...base,
          ai: Math.round(ai * 100),
          state: 'ok',
          classification: res.classification,
          confidenceScore: Number(res.confidenceScore),
          explanation: res.explanation,
        })
      } catch (e) {
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return
        pushPoint({ ...base, ai: null, state: 'error', error: e.message })
        setError(e.message)
      } finally {
        inFlightRef.current -= 1
        setPending(inFlightRef.current)
      }
    },
    [pushPoint],
  )

  const teardown = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
    try {
      procRef.current?.disconnect()
      sourceRef.current?.disconnect()
      sinkRef.current?.disconnect()
    } catch {
      /* already torn down */
    }
    if (procRef.current) procRef.current.onaudioprocess = null
    procRef.current = null
    sourceRef.current = null
    sinkRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => {})
    }
    ctxRef.current = null
    setAnalyser(null)
  }, [])

  const start = useCallback(async () => {
    if (runningRef.current) return
    if (!supported) {
      setError('Live capture is not supported in this browser.')
      return
    }

    setError(null)
    setPoints([])
    setFinalResult(null)
    setElapsed(0)
    segBufRef.current = []
    segLenRef.current = 0
    fullBufRef.current = []
    fullLenRef.current = 0
    segIndexRef.current = 0
    inFlightRef.current = 0
    setPending(0)
    abortRef.current = new AbortController()
    setStatus('starting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = stream

      const Ctx = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctx()
      ctxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume()

      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source

      const node = ctx.createAnalyser()
      node.fftSize = 2048
      node.smoothingTimeConstant = 0.75
      source.connect(node)
      setAnalyser(node)

      const proc = ctx.createScriptProcessor(4096, 1, 1)
      procRef.current = proc

      proc.onaudioprocess = (e) => {
        if (!runningRef.current) return
        const input = e.inputBuffer.getChannelData(0)
        const down = downsample(new Float32Array(input), ctx.sampleRate, TARGET_SAMPLE_RATE)
        if (!down.length) return

        segBufRef.current.push(down)
        segLenRef.current += down.length
        fullBufRef.current.push(down)
        fullLenRef.current += down.length

        // Keep the full take bounded to the model's max inference length.
        const maxFull = MAX_FULL_SECONDS * TARGET_SAMPLE_RATE
        while (fullLenRef.current > maxFull && fullBufRef.current.length > 1) {
          fullLenRef.current -= fullBufRef.current.shift().length
        }

        if (segLenRef.current >= segmentSamples) {
          const merged = concatFloat32(segBufRef.current)
          const segment = merged.slice(0, segmentSamples)
          const leftover = merged.slice(segmentSamples)
          segBufRef.current = leftover.length ? [leftover] : []
          segLenRef.current = leftover.length

          const index = segIndexRef.current++
          analyzeSegment(segment, index, Math.round(index * LIVE_SEGMENT_SECONDS))
        }
      }

      // ScriptProcessor only fires when routed to the destination; a muted gain
      // node keeps it alive without echoing the mic back to the speakers.
      const sink = ctx.createGain()
      sink.gain.value = 0
      sinkRef.current = sink
      source.connect(proc)
      proc.connect(sink)
      sink.connect(ctx.destination)

      runningRef.current = true
      setStatus('running')
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch (e) {
      teardown()
      runningRef.current = false
      setStatus('idle')
      setError(
        e?.name === 'NotAllowedError'
          ? 'Microphone permission was denied.'
          : e?.message || 'Could not start live capture.',
      )
    }
  }, [analyzeSegment, segmentSamples, teardown])

  const stop = useCallback(async () => {
    if (!runningRef.current) return
    runningRef.current = false
    setStatus('finalizing')

    const tail = segLenRef.current ? concatFloat32(segBufRef.current) : new Float32Array(0)
    const full = fullLenRef.current ? concatFloat32(fullBufRef.current) : new Float32Array(0)
    segBufRef.current = []
    segLenRef.current = 0

    teardown()

    // Plot the trailing partial segment when there's enough of it to be useful.
    if (tail.length >= MIN_TAIL_SECONDS * TARGET_SAMPLE_RATE) {
      const index = segIndexRef.current++
      await analyzeSegment(tail, index, Math.round(index * LIVE_SEGMENT_SECONDS))
    }

    // One authoritative pass over the whole take.
    if (full.length >= MIN_TAIL_SECONDS * TARGET_SAMPLE_RATE) {
      try {
        const wav = encodeWav(full, TARGET_SAMPLE_RATE)
        const audioBase64 = await blobToBase64(wav)
        const res = await detectVoice({
          audioBase64,
          language: langRef.current,
          audioFormat: 'wav',
        })
        const entry = {
          classification: res.classification,
          confidenceScore: Number(res.confidenceScore),
          explanation: res.explanation,
          score: res.score != null ? Number(res.score) : undefined,
          maxSegmentScore: res.maxSegmentScore != null ? Number(res.maxSegmentScore) : undefined,
          meanSegmentScore: res.meanSegmentScore != null ? Number(res.meanSegmentScore) : undefined,
          segmentsAnalyzed: res.segmentsAnalyzed,
          aiRatio: res.aiRatio != null ? Number(res.aiRatio) : undefined,
          strongRatio: res.strongRatio != null ? Number(res.strongRatio) : undefined,
          maxRunRatio: res.maxRunRatio != null ? Number(res.maxRunRatio) : undefined,
          threshold: res.threshold != null ? Number(res.threshold) : 0.58,
          segmentScores: Array.isArray(res.segmentScores) ? res.segmentScores : [],
          fileName: `live-session-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wav`,
          fileSize: wav.size,
          audioFormat: 'wav',
          language: langRef.current,
          durationSec: full.length / TARGET_SAMPLE_RATE,
          source: 'live',
          audioUrl: URL.createObjectURL(wav),
        }
        setFinalResult({ ...entry, ts: Date.now() })
        onFinal?.(entry)
      } catch (e) {
        setError(e.message)
      }
    }

    setStatus('idle')
  }, [analyzeSegment, onFinal, teardown])

  const reset = useCallback(() => {
    setPoints([])
    setFinalResult(null)
    setElapsed(0)
    setError(null)
    segIndexRef.current = 0
  }, [])

  useEffect(
    () => () => {
      runningRef.current = false
      abortRef.current?.abort()
      teardown()
    },
    [teardown],
  )

  const scored = points.filter((p) => p.ai != null)
  const latest = scored.length ? scored[scored.length - 1] : null
  const average = scored.length
    ? scored.reduce((s, p) => s + p.ai, 0) / scored.length
    : null

  return {
    supported,
    status,
    running: status === 'running',
    points,
    scored,
    latest,
    average,
    elapsed,
    pending,
    error,
    analyser,
    finalResult,
    segmentSeconds: LIVE_SEGMENT_SECONDS,
    start,
    stop,
    reset,
  }
}
