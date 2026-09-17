import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, LoaderCircle, Wallet } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

export function CajaPage() {
  const { user } = useAuth()
  const canWrite = Number(user?.idRol) !== 3
  const [caja, setCaja] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [form, setForm] = useState({ tipo: 'E', montoTrx: '', descripcionTrx: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [estado, lista] = await Promise.all([
        api('/caja/estado'),
        api('/caja/ultimos-movimientos?limit=10'),
      ])
      setCaja(estado)
      setMovimientos(Array.isArray(lista) ? lista : [])
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { load() }, [])

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      await api('/caja/movimiento', {
        method: 'POST',
        body: { ...form, montoTrx: Number(form.montoTrx), idUsuarioIngreso: user.idUsuario },
      })
      setForm({ tipo: 'E', montoTrx: '', descripcionTrx: '' })
      await load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return <>
    <div className="mb-6"><p className="text-sm font-semibold text-brand-600">Finanzas</p><h1 className="text-3xl font-bold">Caja</h1></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
      <div className="space-y-5">
        <div className="card bg-blue-950 text-white"><Wallet className="text-yellow-400"/><p className="mt-6 text-sm text-blue-200">Saldo disponible</p><p className="text-4xl font-black">Q {Number(caja?.montoTotal || 0).toFixed(2)}</p></div>
        {canWrite && <form className="card" onSubmit={submit}>
          <h2 className="mb-4 font-bold">Registrar ajuste manual</h2>
          <select className="input mb-3" value={form.tipo} onChange={e => setForm({...form, tipo:e.target.value})}><option value="E">Entrada</option><option value="S">Salida</option></select>
          <input className="input mb-3" type="number" min="0.01" step="0.01" required placeholder="Monto" value={form.montoTrx} onChange={e => setForm({...form, montoTrx:e.target.value})}/>
          <textarea className="input min-h-24" required placeholder="Descripción" value={form.descripcionTrx} onChange={e => setForm({...form, descripcionTrx:e.target.value})}/>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="btn-primary mt-4 w-full" disabled={saving}>{saving && <LoaderCircle className="animate-spin" size={17}/>}Guardar ajuste</button>
        </form>}
      </div>
      <div className="card overflow-hidden p-0"><h2 className="border-b p-5 font-bold">Últimos movimientos</h2><div className="divide-y">{movimientos.map((m,i) => <div key={m.idTransaccion || i} className="flex items-center gap-3 p-4">{m.naturaleza === 'S' ? <ArrowDownCircle className="text-red-500"/> : <ArrowUpCircle className="text-emerald-500"/>}<div className="min-w-0 flex-1"><p className="truncate font-medium">{m.descripcionTrx}</p><p className="text-xs text-slate-500">{m.fechaIngreso} {m.horaIngreso}</p></div><p className={`font-bold ${m.naturaleza === 'S' ? 'text-red-600' : 'text-emerald-600'}`}>Q {Number(m.montoTrx).toFixed(2)}</p></div>)}{!movimientos.length && <p className="p-10 text-center text-slate-500">Sin movimientos.</p>}</div></div>
    </div>
  </>
}
