export const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`
export const pct1 = (n) => `${((Number(n) || 0) * 100).toFixed(1)}%`

export function fmtTime(ts){
  try{
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }catch {
    return String(ts)
  }
}

export function fmtDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m ? `${m}m ${r}s` : `${r}s`
}

export function formatBytes(bytes) {
  const b = Number(bytes) || 0
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(2)} MB`
}

export const isAi = (classification) =>
  String(classification || '').toUpperCase().includes('AI')

export const verdictLabel = (classification) =>
  isAi(classification) ? 'AI-Generated' : 'Human'
