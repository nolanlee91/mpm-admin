import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { C } from './theme'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: C.muted, fontSize: '0.9rem' }}>
        Loading…
      </div>
    )
  }
  if (!session) return <Login />
  return <Dashboard session={session} />
}
