import { useCallback, useEffect, useState } from 'react'
import { getHealth } from '../api/client.js'
import { HEALTH_POLL_MS } from '../config/env.js'

export function useHealth(intervalMs = HEALTH_POLL_MS) {
  const [state, setState] = useState({ status: 'checking', data: null, error: null })

  const check = useCallback(async () => {
    try {
      const data = await getHealth()
      setState({ status: 'online', data, error: null })
    } catch (e) {
      setState({ status: 'offline', data: null, error: e.message })
    }
  }, [])

  useEffect(() => {
    check()
    const t = setInterval(check, intervalMs)
    return () => clearInterval(t)
  }, [check, intervalMs])

  return { ...state, refresh: check }
}
