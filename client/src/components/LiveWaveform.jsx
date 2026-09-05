import { useEffect, useRef } from 'react'

/**
 * Canvas mic visualiser: mirrored frequency bars over a live amplitude trace.
 * Bar hue shifts from green to red as the AI likelihood rises.
 */
export default function LiveWaveform({ analyser, active, aiLevel = 0, height = 168 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const aiRef = useRef(aiLevel)
  const phaseRef = useRef(0)
  const traceRef = useRef([])

  useEffect(() => {
    aiRef.current = aiLevel
  }, [aiLevel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width = 0
    let h = height

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      h = rect.height || height
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const freq = analyser ? new Uint8Array(analyser.frequencyBinCount) : null
    const time = analyser ? new Uint8Array(analyser.fftSize) : null

    // green -> amber -> red as ai rises
    const colorFor = (ai, alpha = 1) => {
      const hue = 152 - 152 * Math.min(1, Math.max(0, ai)) // 152 (green) -> 0 (red)
      return `hsla(${hue}, 85%, 58%, ${alpha})`
    }

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      phaseRef.current += 0.03

      const ai = aiRef.current
      const mid = h / 2
      ctx.clearRect(0, 0, width, h)

      // baseline
      ctx.strokeStyle = 'rgba(148,163,184,0.16)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, mid)
      ctx.lineTo(width, mid)
      ctx.stroke()

      if (!active || !analyser) {
        // idle: gentle travelling sine so the panel never looks dead
        ctx.strokeStyle = 'rgba(148,163,184,0.35)'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let x = 0; x <= width; x += 2) {
          const y =
            mid +
            Math.sin(x * 0.02 + phaseRef.current) *
              6 *
              Math.sin(x / Math.max(1, width) * Math.PI)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        return
      }

      analyser.getByteFrequencyData(freq)
      analyser.getByteTimeDomainData(time)

      // ---- mirrored frequency bars ----
      const barCount = Math.max(24, Math.min(72, Math.floor(width / 9)))
      const gap = 3
      const barW = Math.max(2, width / barCount - gap)
      // speech energy sits low in the spectrum; ignore the empty top half
      const usable = Math.floor(freq.length * 0.55)

      for (let i = 0; i < barCount; i++) {
        // logarithmic-ish bucketing so low frequencies get more bars
        const from = Math.floor(Math.pow(i / barCount, 1.55) * usable)
        const to = Math.max(from + 1, Math.floor(Math.pow((i + 1) / barCount, 1.55) * usable))
        let sum = 0
        for (let j = from; j < to; j++) sum += freq[j]
        const v = sum / (to - from) / 255

        const amp = Math.pow(v, 0.85) * (mid - 6)
        const x = i * (barW + gap) + gap / 2
        const barH = Math.max(2, amp)

        const grad = ctx.createLinearGradient(0, mid - barH, 0, mid + barH)
        grad.addColorStop(0, colorFor(ai, 0.95))
        grad.addColorStop(0.5, colorFor(ai, 0.55))
        grad.addColorStop(1, colorFor(ai, 0.95))
        ctx.fillStyle = grad
        ctx.shadowColor = colorFor(ai, 0.5)
        ctx.shadowBlur = 10

        const r = Math.min(barW / 2, 3)
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x, mid - barH, barW, barH * 2, r)
        else ctx.rect(x, mid - barH, barW, barH * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      // ---- scrolling amplitude trace ----
      let sum = 0
      for (let i = 0; i < time.length; i++) {
        const d = (time[i] - 128) / 128
        sum += d * d
      }
      const level = Math.sqrt(sum / time.length)
      const trace = traceRef.current
      trace.push(level)
      const maxTrace = Math.max(40, Math.floor(width / 3))
      while (trace.length > maxTrace) trace.shift()

      ctx.strokeStyle = 'rgba(226,232,240,0.55)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      trace.forEach((lv, i) => {
        const x = (i / (maxTrace - 1)) * width
        const y = mid - Math.min(mid - 4, lv * (mid - 4) * 2.4)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [analyser, active, height])

  return (
    <div className={`waveform ${active ? 'live' : ''}`} style={{ height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {active ? (
        <span className="rec-badge">
          <span className="rec-dot" /> REC
        </span>
      ) : null}
    </div>
  )
}
