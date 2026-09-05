import { useCallback, useEffect, useRef, useState } from 'react'
import { getHealth } from '../api/client.js'
import { HEALTH_POLL_MS } from '../config/env.js'

export function useHealth(intervalMs = HEALTH_POLL_MS) {
  const [state, setState] = useState({ status: 'checking', data: null, error: null })
  const failCountRef = useRef(0)

  const check = useCallback(async () => {
    try {
      const data = await getHealth()
      failCountRef.current = 0
      setState({ status: 'online', data, error: null })
    } catch (e) {
      failCountRef.current += 1
      // Only declare offline after 2 consecutive failures to avoid false alarms during peak inference
      if (failCountRef.current >= 2) {
        setState({ status: 'offline', data: null, error: e.message })
      }
    }
  }, [])

  useEffect(() => {
    check()
    const t = setInterval(check, intervalMs)
    return () => clearInterval(t)
  }, [check, intervalMs])

  return { ...state, refresh: check }
}
