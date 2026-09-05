/**
 * Minimal mono 16-bit PCM WAV encoding + resampling helpers.
 *
 * Live segments are encoded as WAV (rather than sliced out of a MediaRecorder
 * stream) because every segment must be an independently decodable file — the
 * API decodes each request on its own, and webm/opus chunks after the first
 * carry no container header.
 */

/** Averaging decimator. Good enough for 48k -> 16k speech. */
export function downsample(buffer, inRate, outRate) {
  if (!buffer.length || outRate === inRate) return buffer
  if (outRate > inRate) return buffer // never upsample; the model wants <= inRate

  const ratio = inRate / outRate
  const outLength = Math.floor(buffer.length / ratio)
  const out = new Float32Array(outLength)

  let offsetIn = 0
  for (let i = 0; i < outLength; i++) {
    const nextOffsetIn = Math.round((i + 1) * ratio)
    let sum = 0
    let count = 0
    for (let j = offsetIn; j < nextOffsetIn && j < buffer.length; j++) {
      sum += buffer[j]
      count++
    }
    out[i] = count ? sum / count : 0
    offsetIn = nextOffsetIn
  }
  return out
}

export function concatFloat32(chunks) {
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Float32Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

export function rms(samples) {
  if (!samples.length) return 0
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  return Math.sqrt(sum / samples.length)
}

export function peak(samples) {
  let max = 0
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i])
    if (v > max) max = v
  }
  return max
}

/** Encodes mono Float32 samples (-1..1) as a 16-bit PCM WAV Blob. */
export function encodeWav(samples, sampleRate) {
  const bytesPerSample = 2
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // format = PCM
  view.setUint16(22, 1, true) // channels = mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true) // byte rate
  view.setUint16(32, bytesPerSample, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += bytesPerSample
  }

  return new Blob([view], { type: 'audio/wav' })
}

/** Base64 (no data: prefix) for a Blob. */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not encode audio'))
    reader.onload = () => {
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.readAsDataURL(blob)
  })
}
