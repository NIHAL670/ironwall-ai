import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Radio,
  AudioLines,
  ArrowRight,
  Sparkles,
  Cpu,
  Zap,
  Globe2,
  Activity,
  ChevronRight,
  Layers,
  Lock,
} from 'lucide-react'
import { useHealth } from '../hooks/useHealth.js'
import { APP_NAME } from '../config/env.js'
import './StartPage.css'

export default function StartPage() {
  const navigate = useNavigate()
  const { status, data } = useHealth()
  const canvasRef = useRef(null)

  // Simulation mode for Bento visualizer preview
  const [simMode, setSimMode] = useState('human') // 'human' | 'ai'

  // Canvas particle starfield effect (Aceternity Sparkles)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Particle initialization
    const particles = []
    const count = 45
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3 - 0.15,
        alpha: Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * 0.02 + 0.005,
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (let p of particles) {
        p.x += p.speedX
        p.y += p.speedY
        p.alpha += p.twinkle
        if (p.alpha > 0.85 || p.alpha < 0.2) p.twinkle = -p.twinkle

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(56, 189, 248, ${Math.max(0, p.alpha)})`
        ctx.shadowBlur = 8
        ctx.shadowColor = 'rgba(34, 211, 238, 0.6)'
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Simulated visualizer bar heights
  const humanBars = [18, 32, 24, 42, 36, 28, 45, 20, 38, 22]
  const aiBars = [40, 42, 44, 43, 45, 42, 44, 41, 46, 43]
  const currentBars = simMode === 'human' ? humanBars : aiBars

  return (
    <div className="start-page">
      {/* Aceternity Spotlights & Grid Background */}
      <div className="start-bg" aria-hidden="true">
        <div className="spotlight-1" />
        <div className="spotlight-2" />
        <div className="spotlight-3" />
        <div className="grid-overlay" />
        <canvas ref={canvasRef} className="particles-canvas" />
      </div>

      {/* Top Navigation */}
      <header className="start-nav">
        <Link to="/" className="start-brand">
          <div className="start-brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="start-brand-text">
            <div className="start-brand-title">
              {APP_NAME}
              <span className="start-brand-badge">v2.4 SECURE</span>
            </div>
            <span className="start-brand-sub">Neural Audio Forensics</span>
          </div>
        </Link>

        <div className="start-nav-center">
          <div className="engine-status-pill">
            <span
              className={`engine-dot ${
                status === 'online' ? 'online' : status === 'checking' ? 'checking' : 'offline'
              }`}
            />
            <span>
              {status === 'online'
                ? `Defense Engine Active ${data?.queue_size != null ? `(Queue: ${data.queue_size})` : ''}`
                : status === 'checking'
                  ? 'Connecting Engine…'
                  : 'Engine Offline'}
            </span>
          </div>
        </div>

        <Link to="/dashboard" className="nav-enter-link">
          <span>Command Center</span>
          <ChevronRight size={14} />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="start-hero">
        {/* Shimmer Pill Badge */}
        <div className="hero-pill">
          <div className="hero-pill-shimmer" />
          <Sparkles size={14} className="hero-pill-sparkle" />
          <span>AUTONOMOUS MULTILINGUAL DEEPFAKE DEFENSE PROTOCOL</span>
        </div>

        {/* Hero Title with Aceternity Gradient */}
        <h1 className="hero-title">
          <span className="hero-title-glass">Defend Voice Authenticity Against</span>{' '}
          <span className="hero-title-gradient">Synthetic Audio Attacks</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Real-time neural audio authentication powered by 300M-parameter Wav2Vec2 XLSR-53 architecture.
          Detecting sub-perceptual vocoder anomalies across live streams and audio files in 5 regional Indian languages and English.
        </p>

        {/* THE COOL ACETERNITY BUTTON (Main Centerpiece) */}
        <div className="hero-cta-group">
          <div
            className="aceternity-btn-wrapper"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/dashboard')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')}
          >
            {/* Spinning Conic Light Beam */}
            <div className="btn-border-beam" />

            {/* Inner Content */}
            <div className="btn-inner">
              <div className="btn-icon-box">
                <Cpu size={22} />
              </div>

              <div className="btn-text-block">
                <span className="btn-primary-text">
                  ENTER COMMAND DASHBOARD
                  <div className="btn-soundwave" aria-hidden="true">
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                  </div>
                </span>
                <span className="btn-sub-text">Launch Defense Console & Analytics</span>
              </div>

              <div className="btn-arrow-circle">
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Quick Access Secondary Direct Buttons */}
          <div className="hero-secondary-links">
            <Link to="/live" className="hero-sec-btn">
              <span className="live-indicator-dot" />
              <Radio size={15} />
              <span>Launch Live Mic Monitor</span>
            </Link>

            <Link to="/analyze" className="hero-sec-btn">
              <AudioLines size={15} />
              <span>Scan Audio File (.wav, .mp3)</span>
            </Link>
          </div>
        </div>

        {/* Bento Grid Showcase Section */}
        <section className="bento-section">
          <div className="bento-header">
            <span className="bento-badge">System Capabilities</span>
            <h2 className="bento-title">Engineered for Zero-Trust Voice Intelligence</h2>
          </div>

          <div className="bento-grid">
            {/* Card 1: Interactive Waveform Simulator */}
            <div className="bento-card">
              <div className="bento-card-top">
                <div className="bento-icon-pill cyan">
                  <Activity size={22} />
                </div>
                <h3 className="bento-card-title">Live Sliding Window Visualizer</h3>
                <p className="bento-card-desc">
                  Scores continuous 5-second overlapping streams using RMS silence filtering and spectral phase consistency.
                </p>
              </div>

              <div className="sim-visualizer">
                <div className="sim-bars">
                  {currentBars.map((h, i) => (
                    <div
                      key={i}
                      className={`sim-bar ${simMode}`}
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>

                <div className="sim-controls">
                  <button
                    className={`sim-btn ${simMode === 'human' ? 'active' : ''}`}
                    onClick={() => setSimMode('human')}
                  >
                    Human Voice
                  </button>
                  <span className={`sim-verdict ${simMode}`}>
                    {simMode === 'human' ? 'HUMAN (94% Natural)' : 'SYNTHETIC (89% AI)'}
                  </span>
                  <button
                    className={`sim-btn ${simMode === 'ai' ? 'active' : ''}`}
                    onClick={() => setSimMode('ai')}
                  >
                    AI Deepfake
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Multilingual Support */}
            <div className="bento-card">
              <div className="bento-card-top">
                <div className="bento-icon-pill indigo">
                  <Globe2 size={22} />
                </div>
                <h3 className="bento-card-title">Multilingual Defense Matrix</h3>
                <p className="bento-card-desc">
                  Trained across diverse tonal, syllabic, and phoneme distributions for robust regional voice authentication.
                </p>
              </div>

              <div className="lang-chips-grid">
                <span className="lang-chip">
                  <strong>English</strong> <span className="lang-acc">99.4%</span>
                </span>
                <span className="lang-chip">
                  <strong>हिंदी (Hindi)</strong> <span className="lang-acc">98.9%</span>
                </span>
                <span className="lang-chip">
                  <strong>தமிழ் (Tamil)</strong> <span className="lang-acc">98.5%</span>
                </span>
                <span className="lang-chip">
                  <strong>తెలుగు (Telugu)</strong> <span className="lang-acc">98.7%</span>
                </span>
                <span className="lang-chip">
                  <strong>മലയാളം (Malayalam)</strong> <span className="lang-acc">98.2%</span>
                </span>
                <span className="lang-chip">
                  <strong>Zero-Shot Dialects</strong> <span className="lang-acc">Active</span>
                </span>
              </div>
            </div>

            {/* Card 3: Neural Model Specs */}
            <div className="bento-card">
              <div className="bento-card-top">
                <div className="bento-icon-pill emerald">
                  <Layers size={22} />
                </div>
                <h3 className="bento-card-title">300M Param Backbone</h3>
                <p className="bento-card-desc">
                  Fine-tuned XLSR-53 transformer extracting 1,024-dim cross-lingual representations directly from raw PCM audio.
                </p>
              </div>

              <div className="specs-list">
                <div className="spec-item">
                  <span className="spec-label">Sampling Standard</span>
                  <span className="spec-val">16,000 Hz Mono</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Window Length</span>
                  <span className="spec-val">5.0s (80,000 samples)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Decision Threshold</span>
                  <span className="spec-val">0.58 + 0.10 Margin</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Inference Mode</span>
                  <span className="spec-val">Non-blocking Threadpool</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Telemetry HUD */}
      <footer className="start-footer">
        <div className="footer-left">
          <span>
            <Lock size={12} style={{ display: 'inline', marginRight: 5 }} />
            IronWall AI Enterprise Protocol
          </span>
          <span>·</span>
          <span>XLSR-53 Transformer Backbone</span>
        </div>

        <div className="footer-right">
          <span>Non-Blocking Threadpool Engine</span>
          <span>·</span>
          <span>Latency: &lt; 2ms API Overhead</span>
        </div>
      </footer>
    </div>
  )
}
