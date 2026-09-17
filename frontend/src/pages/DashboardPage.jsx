import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Pencil, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import fondoPollito from '../../../legacy-frontend/img/FondoPollito.jpg'

function quarterStart() {
  const date = new Date()
  date.setMonth(date.getMonth() - 2, 1)
  date.setHours(0, 0, 0, 0)
  return date
}

export function DashboardPage() {
  const { user } = useAuth()
  const [donaciones, setDonaciones] = useState([])
  const [goal, setGoal] = useState(2000)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('2000')
  const [savingGoal, setSavingGoal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api('/donaciones'), api('/configuracion/meta-donaciones')])
      .then(([data, config]) => { setDonaciones(Array.isArray(data) ? data : []); setGoal(Number(config.metaDonaciones)); setGoalInput(String(config.metaDonaciones)) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const progress = useMemo(() => {
    const start = quarterStart()
    const current = donaciones
      .filter(item => item.fechaIngreso && new Date(`${item.fechaIngreso}T00:00:00`) >= start)
      .reduce((sum, item) => sum + Number(item.montoDonado || 0), 0)
    return { current, remaining: Math.max(goal - current, 0), percentage: Math.min((current / goal) * 100, 100) }
  }, [donaciones, goal])

  async function saveGoal(event) {
    event.preventDefault(); setSavingGoal(true); setError('')
    try { const result = await api('/configuracion/meta-donaciones', { method: 'PUT', body: { metaDonaciones: Number(goalInput) } }); setGoal(Number(result.metaDonaciones)); setEditingGoal(false) }
    catch (err) { setError(err.message) } finally { setSavingGoal(false) }
  }

  return <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-6">
    <div className="w-full max-w-4xl text-center">
      {loading ? <LoaderCircle className="mx-auto animate-spin text-brand-600" size={48}/> : <div className="relative mx-auto grid size-80 place-items-center rounded-full p-4 shadow-[0_24px_80px_rgba(30,64,175,.25)] sm:size-[28rem]" style={{ background: `conic-gradient(#facc15 ${progress.percentage * 3.6}deg, #dbeafe 0deg)` }} aria-label={`${progress.percentage.toFixed(0)} por ciento de la meta alcanzada`}>
        <div className="relative size-full overflow-hidden rounded-full border-4 border-white bg-blue-950 shadow-inner">
          <img src={fondoPollito} alt="Familias beneficiadas por Operación Pollito" className="absolute inset-0 size-full object-cover"/>
          <div className="absolute inset-0 bg-blue-950/55"/>
          <div className="relative grid size-full place-items-center text-white"><div><p className="text-7xl font-black tracking-tight drop-shadow-lg sm:text-8xl">{progress.percentage.toFixed(0)}%</p><p className="mt-2 text-sm font-bold uppercase tracking-[.22em] text-yellow-300">Meta alcanzada</p></div></div>
        </div>
      </div>}
      {error && <p className="mx-auto mt-5 max-w-md rounded-xl bg-red-50 p-3 text-sm text-red-700">No se pudo cargar el progreso: {error}</p>}
      {!loading && <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card border-blue-100 text-left"><p className="text-sm font-medium text-slate-500">Recaudado</p><p className="mt-2 text-3xl font-black text-brand-600">Q {progress.current.toFixed(2)}</p></div>
        <div className="card relative border-yellow-200 bg-yellow-50 text-left"><p className="text-sm font-medium text-blue-800">Meta trimestral</p><p className="mt-2 text-3xl font-black text-blue-950">Q {goal.toFixed(2)}</p>{Number(user?.idRol) === 1 && <button onClick={() => setEditingGoal(true)} className="absolute right-4 top-4 rounded-lg p-2 text-blue-700 hover:bg-yellow-100" title="Modificar meta"><Pencil size={18}/></button>}</div>
        <div className="card border-blue-100 text-left"><p className="text-sm font-medium text-slate-500">Falta para la meta</p><p className="mt-2 text-3xl font-black text-brand-600">Q {progress.remaining.toFixed(2)}</p></div>
      </section>}
      {editingGoal && <div className="fixed inset-0 z-50 grid place-items-center bg-blue-950/60 p-4"><form onSubmit={saveGoal} className="w-full max-w-sm rounded-2xl bg-white p-6 text-left shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-blue-950">Modificar meta</h2><button type="button" onClick={() => setEditingGoal(false)}><X/></button></div><label className="mb-1.5 mt-5 block text-sm font-medium">Nueva meta trimestral</label><input className="input" type="number" min="0.01" step="0.01" required value={goalInput} onChange={event => setGoalInput(event.target.value)}/><div className="mt-6 flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setEditingGoal(false)}>Cancelar</button><button className="btn-primary" disabled={savingGoal}>{savingGoal && <LoaderCircle size={17} className="animate-spin"/>}Guardar</button></div></form></div>}
    </div>
  </main>
}
