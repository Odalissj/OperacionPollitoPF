import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import sonrisasLogo from '../../../legacy-frontend/img/Sonrisas.png'
import fondoPollito from '../../../legacy-frontend/img/FondoPollitoAnimado.png'

export function LoginPage() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ nombreUsuario: '', contrasena: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (session) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true)
    try {
      await login(form.nombreUsuario.trim(), form.contrasena)
      navigate(location.state?.from || '/', { replace: true })
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.12fr_.88fr]">
    <section className="relative h-64 overflow-hidden bg-blue-950 bg-cover bg-center sm:h-80 lg:h-screen" style={{ backgroundImage: `url(${fondoPollito})` }} aria-label="Familias de Operación Pollito">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/45 via-transparent to-blue-950/10 lg:bg-gradient-to-r lg:from-blue-950/15 lg:via-transparent lg:to-blue-950/30"/>
      <div className="absolute bottom-0 left-0 h-1.5 w-full bg-yellow-400 lg:bottom-auto lg:left-auto lg:right-0 lg:top-0 lg:h-full lg:w-2"/>
    </section>

    <section className="relative flex min-h-[calc(100vh-14rem)] items-center justify-center bg-[#f8fafc] px-6 py-10 sm:min-h-[calc(100vh-18rem)] sm:px-12 lg:min-h-screen lg:px-16 xl:px-24">
      <div className="absolute right-0 top-0 size-48 overflow-hidden opacity-40"><div className="absolute -right-24 -top-24 size-48 rounded-full border-[28px] border-blue-100"/></div>
      <div className="relative w-full max-w-md">
        <div className="mb-10 flex items-center justify-between border-b border-slate-200 pb-7">
          <img src={sonrisasLogo} alt="Proyecto Sonrisas" className="h-20 w-36 object-contain sm:h-24 sm:w-44"/>
          <div className="text-right"><p className="text-xs font-black uppercase tracking-[.2em] text-brand-600">Operación</p><p className="mt-1 text-xl font-black tracking-tight text-blue-950">Pollito</p></div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-blue-950 sm:text-4xl">Iniciar sesión</h1>
          <div className="mt-4 h-1 w-12 rounded-full bg-yellow-400"/>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Usuario</span>
            <span className="group relative block">
              <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600" size={19}/>
              <input className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-blue-100" autoComplete="username" placeholder="Nombre de usuario" value={form.nombreUsuario} onChange={e => setForm({ ...form, nombreUsuario: e.target.value })} required autoFocus/>
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Contraseña</span>
            <span className="group relative block">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600" size={19}/>
              <input className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-blue-100" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Contraseña" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} required/>
              <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-600" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
            </span>
          </label>
          <div className="flex justify-end"><Link to="/recuperar-contrasena" className="text-sm font-bold text-brand-600 hover:text-brand-700 hover:underline">¿Olvidaste tu contraseña?</Link></div>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-950 font-bold text-white shadow-[0_12px_28px_rgba(7,27,58,.18)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
            {loading ? <LoaderCircle className="animate-spin" size={19}/> : <>Ingresar <ArrowRight className="transition group-hover:translate-x-1" size={19}/></>}
          </button>
        </form>
        <p className="mt-9 text-center text-xs text-slate-400">Acceso exclusivo para personal autorizado</p>
      </div>
    </section>
  </main>
}
