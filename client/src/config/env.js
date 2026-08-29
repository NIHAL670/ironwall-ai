const raw = import.meta.env
const trimSlash = (s) => String(s || '').replace(/\/+$/, '')

export const API_BASE_URL = trimSlash(raw.VITE_API_BASE_URL || '/api') || '/api'

// Optional key sent as the `x-api-key` header
export const API_KEY = raw.VITE_API_KEY || ''

// Detection endpoint path, relative to API_BASE_URL. 
export const DETECT_PATH = raw.VITE_DETECT_PATH || '/voice-detection'


//  Health lives at the server root, one level above the `/api` prefix.
//  Derived so a single VITE_API_BASE_URL is enough to configure the app.
export const HEALTH_URL = /\/api$/.test(API_BASE_URL)
  ? API_BASE_URL.replace(/\/api$/, '') + '/health'
  : API_BASE_URL + '/health'

// Seconds of audio per live segment. Matches the model's 5s analysis window
export const LIVE_SEGMENT_SECONDS = Number(raw.VITE_LIVE_SEGMENT_SECONDS || 5)

// Sample rate sent to the API. The model expects 16 kHz (config.SR)
export const TARGET_SAMPLE_RATE = Number(raw.VITE_TARGET_SAMPLE_RATE || 16000)

// Request timeout in ms for a single detection call
export const REQUEST_TIMEOUT_MS = Number(raw.VITE_REQUEST_TIMEOUT_MS || 120000)

// How often the header polls /health, in ms
export const HEALTH_POLL_MS = Number(raw.VITE_HEALTH_POLL_MS || 15000)

// Max concurrent live segment requests before segments are dropped
export const MAX_INFLIGHT_SEGMENTS = Number(raw.VITE_MAX_INFLIGHT_SEGMENTS || 2)


//  Seconds of audio scored for the end-of-session verdict (most recent window).
//  CPU inference is ~1x real time, so keep this well under REQUEST_TIMEOUT_MS.
 
export const MAX_SESSION_SECONDS = Number(raw.VITE_MAX_SESSION_SECONDS || 60)

export const APP_NAME = raw.VITE_APP_NAME || 'IronWall AI'

export default {
  API_BASE_URL,
  API_KEY,
  DETECT_PATH,
  HEALTH_URL,
  LIVE_SEGMENT_SECONDS,
  TARGET_SAMPLE_RATE,
  REQUEST_TIMEOUT_MS,
  HEALTH_POLL_MS,
  MAX_INFLIGHT_SEGMENTS,
  MAX_SESSION_SECONDS,
  APP_NAME,
}
