import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn } from 'lucide-react'
import './Login.css'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [modoRegistro, setModoRegistro] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault()

    setCargando(true)
    setMensaje('')

    if (modoRegistro) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setMensaje(error.message)
      } else {
        setMensaje(
          'Cuenta creada. Ahora puedes iniciar sesión.'
        )
        setModoRegistro(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMensaje(error.message)
      } else {
        onLogin()
      }
    }

    setCargando(false)
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <LogIn size={28} />
        </div>

        <h1>CloudProjectHub</h1>

        <p>
          Guarda y administra tus proyectos en la nube.
        </p>

        <form onSubmit={manejarSubmit}>
          <label>Correo electrónico</label>

          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Contraseña</label>

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {mensaje && (
            <div className="login-message">
              {mensaje}
            </div>
          )}

          <button type="submit" disabled={cargando}>
            {cargando
              ? 'Procesando...'
              : modoRegistro
                ? 'Crear cuenta'
                : 'Iniciar sesión'}
          </button>
        </form>

        <button
          className="switch-button"
          onClick={() => {
            setModoRegistro(!modoRegistro)
            setMensaje('')
          }}
        >
          {modoRegistro
            ? 'Ya tengo una cuenta'
            : 'Crear una cuenta'}
        </button>
      </div>
    </main>
  )
}