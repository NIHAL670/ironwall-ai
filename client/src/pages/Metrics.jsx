import VoiceDetectorMetrics from '../components/VoiceDetectorMetrics.jsx'

export default function Metrics() {
  return (
    <div className="page metrics-page">
      <div className="metrics-page-header">
        <h2 className="section-title">Voice Detector Evaluation</h2>
        <p className="muted">
          Comprehensive evaluation metrics for the deepfake detection model.
          Computed from your scan history — tag samples with ground truth labels for rigorous analysis.
        </p>
      </div>
      <VoiceDetectorMetrics />
    </div>
  )
}
