import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { api } from '../lib/api'
import sonrisasLogo from '../../../legacy-frontend/img/Sonrisas.png'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(''), [loading, setLoading] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')
  async function submit(event) { event.preventDefault(); setLoading(true); setError(''); setMessage(''); try { const result = await api('/auth/forgot-password', { method: 'POST', body: { email } }); setMessage(result.message) } catch (e) { setError(e.message) } finally { setLoading(false) } }
  return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
    <img src={sonrisasLogo} alt="Proyecto Sonrisas" className="mx-auto h-28 w-40 object-contain"/><h1 className="mt-4 text-center text-3xl font-black text-blue-950">Recuperar contraseña</h1>
    <label className="mb-1.5 mt-7 block text-sm font-medium">Correo registrado</label><input className="input" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)}/>
    {message && <p className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 size={19}/>{message}</p>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button className="btn-primary mt-6 w-full" disabled={loading}>{loading && <LoaderCircle className="animate-spin" size={18}/>}Enviar enlace</button><Link to="/login" className="mt-5 block text-center text-sm font-semibold text-brand-600">Volver al inicio de sesión</Link>
  </form></main>
}
