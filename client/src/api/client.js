import axios from 'axios'
import {
  API_BASE_URL,
  API_KEY,
  DETECT_PATH,
  HEALTH_URL,
  REQUEST_TIMEOUT_MS,
} from '../config/env.js'

export const API_INFO = {
  base: API_BASE_URL,
  detect: API_BASE_URL + DETECT_PATH,
  health: HEALTH_URL,
  keySet: Boolean(API_KEY),
}

const http = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS })
if (API_KEY) http.defaults.headers.common['x-api-key'] = API_KEY

function toMessage(err) {
  const data = err?.response?.data
  if (data?.message) return data.message
  if (data?.detail) {
    return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
  }
  if (err?.code === 'ECONNABORTED') return 'Request timed out. The model may still be warming up.'
  if (err?.response?.status === 503) return 'Server busy — inference queue is full.'
  return err?.message || 'Request failed'
}

/**
 * POST {API_BASE_URL}{DETECT_PATH}
 * @returns {Promise<{status:string, classification:string, confidenceScore:number, explanation:string}>}
 */
export async function detectVoice({ audioBase64, language, audioFormat }, { signal } = {}) {
  try {
    const { data } = await http.post(
      DETECT_PATH,
      { audioBase64, language, audioFormat },
      { signal },
    )
    if (data?.status === 'error') throw new Error(data.message || 'Detection failed')
    return data
  } catch (err) {
    if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') throw err
    throw new Error(toMessage(err))
  }
}

export async function getHealth() {
  const { data } = await axios.get(HEALTH_URL, { timeout: 6000 })
  return data
}
