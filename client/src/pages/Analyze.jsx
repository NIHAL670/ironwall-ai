import { useState } from 'react'
import UploadPanel from '../components/UploadPanel.jsx'
import ResultCard from '../components/ResultCard.jsx'
import { useHistory } from '../hooks/useHistory.jsx'

export default function Analyze() {
  const { add } = useHistory()
  const [result, setResult] = useState(null)

  const handleResult = (entry) => {
    const withTs = { ...entry, ts: Date.now() }
    add(entry)
    setResult(withTs)
  }

  return (
    <div className="page analyze-page">
      <div className="split">
        <UploadPanel onResult={handleResult} />
        <div className="latest-col">
          <h2>Result</h2>
          {result ? (
            <ResultCard entry={result} />
          ) : (
            <p className="muted empty card">
              Submit an audio sample and the classification, confidence score and model
              reasoning will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
