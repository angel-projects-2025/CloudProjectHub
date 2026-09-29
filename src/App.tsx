import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [sesionActiva, setSesionActiva] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let montado = true

    async function verificarSesion() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (montado) {
          setSesionActiva(!!session)
          setCargando(false)
        }
      } catch (error) {
        console.error(
          'Error al verificar sesión:',
          error
        )

        if (montado) {
          setSesionActiva(false)
          setCargando(false)
        }
      }
    }

    verificarSesion()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (montado) {
          setSesionActiva(!!session)
        }
      }
    )

    return () => {
      montado = false
      subscription.unsubscribe()
    }
  }, [])

  function manejarLogin() {
    setSesionActiva(true)
  }

  if (cargando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          color: '#0f172a',
        }}
      >
        Cargando CloudProjectHub...
      </div>
    )
  }

  if (!sesionActiva) {
    return <Login onLogin={manejarLogin} />
  }

  return <Dashboard />
}