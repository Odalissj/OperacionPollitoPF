import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { api } from '../lib/api'

export function ResetPasswordPage() {
  const [params] = useSearchParams(), token = params.get('token') || ''
  const [form, setForm] = useState({ password: '', confirm: '' }), [loading, setLoading] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')
  async function submit(event) { event.preventDefault(); setError(''); setMessage(''); if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.'); setLoading(true); try { const result = await api('/auth/reset-password', { method: 'POST', body: { token, password: form.password } }); setMessage(result.message); setForm({ password: '', confirm: '' }) } catch (e) { setError(e.message) } finally { setLoading(false) } }
  return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
    <h1 className="text-center text-3xl font-black text-blue-950">Nueva contraseña</h1>{!token && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">El enlace de recuperación está incompleto.</p>}
    <label className="mb-1.5 mt-7 block text-sm font-medium">Nueva contraseña</label><input className="input" type="password" minLength="12" autoComplete="new-password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })}/>
    <label className="mb-1.5 mt-4 block text-sm font-medium">Confirmar contraseña</label><input className="input" type="password" minLength="12" autoComplete="new-password" required value={form.confirm} onChange={event => setForm({ ...form, confirm: event.target.value })}/>
    {message && <p className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 size={19}/>{message}</p>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button className="btn-primary mt-6 w-full" disabled={loading || !token}>{loading && <LoaderCircle className="animate-spin" size={18}/>}Cambiar contraseña</button><Link to="/login" className="mt-5 block text-center text-sm font-semibold text-brand-600">Ir al inicio de sesión</Link>
  </form></main>
}
