import { useRef, useState } from 'react'
import { UploadCloud, Mic, Square, Loader2, X } from 'lucide-react'
import { detectVoice } from '../api/client.js'
import { useRecorder } from '../hooks/useRecorder.js'
import {
  fileToBase64,
  getAudioDuration,
  extToFormat,
  MAX_FILE_BYTES,
} from '../utils/audio.js'
import { formatBytes, fmtDuration } from '../utils/format.js'

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam']

export default function UploadPanel({ onResult }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [language, setLanguage] = useState('English')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const rec = useRecorder()

  const pickFile = (f) => {
    setError(null)
    if (!f) return
    if (f.size > MAX_FILE_BYTES) {
      setError(`File is ${formatBytes(f.size)}. Keep it under ${formatBytes(MAX_FILE_BYTES)} (server body limit).`)
      return
    }
    rec.reset()
    setFile(f)
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(f)
    })
  }

  const clearAll = () => {
    setFile(null)
    setError(null)
    rec.reset()
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const activeFile = file || rec.result?.file || null

  const analyze = async () => {
    if (!activeFile || busy) return
    setBusy(true)
    setError(null)
    try {
      const [audioBase64, durationSec] = await Promise.all([
        fileToBase64(activeFile),
        getAudioDuration(activeFile),
      ])
      const audioFormat = extToFormat(activeFile.name)
      const res = await detectVoice({ audioBase64, language, audioFormat })

      if (res?.status === 'error') throw new Error(res.message || 'Detection failed')

      onResult?.({
        classification: res.classification,
        confidenceScore: Number(res.confidenceScore),
        explanation: res.explanation,
        fileName: activeFile.name,
        fileSize: activeFile.size,
        audioFormat,
        language,
        durationSec,
      })
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="upload-panel card">
      <div className="card-head">
        <h2>Analyze an audio sample</h2>
        <p className="muted">Upload a clip or record from your mic. Max {formatBytes(MAX_FILE_BYTES)}.</p>
      </div>

      <div
        className={`dropzone ${dragging ? 'drag' : ''} ${activeFile ? 'has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          pickFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => !activeFile && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        {!activeFile ? (
          <div className="dz-empty">
            <UploadCloud size={28} />
            <p><strong>Click to browse</strong> or drag an audio file here</p>
            <span className="muted">mp3 · wav · flac · ogg · m4a · webm</span>
          </div>
        ) : (
          <div className="dz-file">
            <div>
              <strong>{activeFile.name}</strong>
              <span className="muted">
                {formatBytes(activeFile.size)}
                {rec.result && !file ? ' · recorded' : ''}
              </span>
            </div>
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation()
                clearAll()
              }}
              title="Remove"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {previewUrl || rec.result?.url ? (
        <audio className="audio-preview" controls src={previewUrl || rec.result.url} />
      ) : null}

      <div className="recorder-row">
        {!rec.recording ? (
          <button
            className="btn ghost"
            onClick={rec.start}
            disabled={!rec.supported || busy}
            title={rec.supported ? 'Record from microphone' : 'Recording not supported here'}
          >
            <Mic size={16} /> Record
          </button>
        ) : (
          <button className="btn danger" onClick={rec.stop}>
            <Square size={16} /> Stop · {fmtDuration(rec.seconds)}
          </button>
        )}

        <label className="lang-select">
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={busy}>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {rec.error ? <div className="alert error">{rec.error}</div> : null}

      <button className="btn primary block" onClick={analyze} disabled={!activeFile || busy}>
        {busy ? (
          <>
            <Loader2 size={16} className="spin" /> Analyzing…
          </>
        ) : (
          'Run detection'
        )}
      </button>
    </div>
  )
}
