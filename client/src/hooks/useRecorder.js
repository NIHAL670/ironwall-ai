import { useCallback, useEffect, useRef, useState } from 'react'

const supported =
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia)

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState(null) // { blob, url, file }
  const [error, setError] = useState(null)

  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const start = useCallback(async () => {
    if (!supported) {
      setError('Recording is not supported in this browser.')
      return
    }
    setError(null)
    setResult(null)
    setSeconds(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type })
        setResult({ blob, url: URL.createObjectURL(blob), file })
        stopTracks()
      }
      rec.start()
      mediaRef.current = rec
      setRecording(true)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch (e) {
      setError(e.message || 'Microphone access denied')
      stopTracks()
    }
  }, [])

  const stop = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }, [])

  const reset = useCallback(() => {
    setResult((r) => {
      if (r?.url) URL.revokeObjectURL(r.url)
      return null
    })
    setSeconds(0)
    setError(null)
  }, [])

  useEffect(() => () => {
    clearInterval(timerRef.current)
    stopTracks()
  }, [])

  return { supported, recording, seconds, result, error, start, stop, reset }
}
