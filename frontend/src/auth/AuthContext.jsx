/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import { api } from '../lib/api'

const STORAGE_KEY = 'pollito.session.v3'
const AuthContext = createContext(null)

function readSession() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!value || value.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return value
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  async function login(nombreUsuario, contrasena) {
    const response = await api('/auth/login', { method: 'POST', body: { nombreUsuario, contrasena } })
    const next = { ...response, expiresAt: Date.now() + 4 * 60 * 60 * 1000 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
  }

  async function logout() {
    try {
      if (session?.refreshToken) await api('/auth/logout', { method: 'POST', body: { refreshToken: session.refreshToken } })
    } finally {
      localStorage.removeItem(STORAGE_KEY)
      setSession(null)
    }
  }

  const value = { session, user: session?.user, login, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
