import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

export function ProgressPage() {
  const [donaciones, setDonaciones] = useState([])
  const [goal, setGoal] = useState(2000)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api('/donaciones'), api('/configuracion/meta-donaciones')])
      .then(([data, config]) => { setDonaciones(Array.isArray(data) ? data : []); setGoal(Number(config.metaDonaciones)) })
      .catch(err => setError(err.message))
  }, [])

  const current = useMemo(() => {
    const start = new Date(); start.setMonth(start.getMonth() - 2, 1)
    return donaciones.filter(item => new Date(`${item.fechaIngreso}T00:00:00`) >= start).reduce((sum, item) => sum + Number(item.montoDonado || 0), 0)
  }, [donaciones])
  const percentage = Math.min(current / goal * 100, 100)

  return <>
    <div className="mb-6"><p className="text-sm font-semibold text-brand-600">Donaciones</p><h1 className="text-3xl font-bold">Pollito Progress</h1></div>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    <div className="card"><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-sm text-slate-500">Meta trimestral</p><p className="text-2xl font-bold">Q {goal.toFixed(2)}</p></div><div><p className="text-sm text-slate-500">Recaudado</p><p className="text-2xl font-bold text-emerald-600">Q {current.toFixed(2)}</p></div><div><p className="text-sm text-slate-500">Restante</p><p className="text-2xl font-bold">Q {Math.max(goal-current,0).toFixed(2)}</p></div></div><div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{width:`${percentage}%`}}/></div><p className="mt-2 text-right text-sm font-semibold">{percentage.toFixed(1)}%</p></div>
    <div className="card mt-5 overflow-hidden p-0"><h2 className="border-b p-5 font-bold">Donaciones recientes</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Fecha</th><th className="p-3">Donante</th><th className="p-3">Monto</th></tr></thead><tbody className="divide-y">{donaciones.slice(0,20).map(item=><tr key={item.idDonacion}><td className="p-3">{item.fechaIngreso}</td><td className="p-3">{item.nombreDonante}</td><td className="p-3 font-semibold">Q {Number(item.montoDonado).toFixed(2)}</td></tr>)}</tbody></table></div></div>
  </>
}
