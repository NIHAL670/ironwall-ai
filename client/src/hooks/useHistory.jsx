import { createContext, useCallback, useContext, useEffect, useState } from 'react'
const KEY = 'ironwall.history.v1'
const Ctx = createContext(null)

function load(){
  try{
    const raw = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(raw) ? raw : []
  }catch{
    return []
  }
}

function makeId(){
  try{
    return crypto.randomUUID()
  }catch{
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

export function HistoryProvider({ children }){
  const [items, setItems] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    }catch{
      /* storage unavailable — keep in-memory only */
    }
  }, [items])

  const add = useCallback((entry)=>{
    setItems((prev)=>
      [{ id: makeId(), ts: Date.now(), ...entry }, ...prev].slice(0, 200),
    )
  }, [])

  const remove = useCallback((id)=>{
    setItems((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])
  return <Ctx.Provider value={{ items, add, remove, clear }}>{children}</Ctx.Provider>
}

export function useHistory() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useHistory must be used within <HistoryProvider>')
  return ctx
}
