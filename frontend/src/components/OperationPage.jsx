import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { SearchableSelect } from './SearchableSelect'

const rowsFrom = v => Array.isArray(v) ? v : (v && Object.values(v).find(Array.isArray)) || []

export function OperationPage({ title, endpoint, fields, transform, lines = false, lineUnitPrice = 60 }) {
  const { user } = useAuth()
  const newLine = () => ({ cantidad: 1, valorUnidad: lineUnitPrice })
  const [form, setForm] = useState({}), [lookups, setLookups] = useState({}), [items, setItems] = useState([newLine()]), [saving, setSaving] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('')
  // Los campos son configuración declarativa de la ruta; se recargan al cambiar la operación.
  useEffect(() => {
    const sources = [...new Set(fields.map(f => f.source).filter(Boolean))]
    Promise.all(sources.map(s => api(`/${s}`))).then(all => setLookups(Object.fromEntries(sources.map((s, i) => [s, rowsFrom(all[i])])))).catch(e => setError(e.message))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.cantidad || 0) * Number(item.valorUnidad || 0), 0), [items])
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const calculated = Object.fromEntries(fields.filter(field => field.calculate).map(field => [field.name, field.calculate(form)]))
      const base = { ...form, ...calculated, idUsuarioIngreso: user.idUsuario, idUsuarioIngresa: user.idUsuario, idUsuario: user.idUsuario }
      const body = transform ? transform(base, items, total) : base
      const result = await api(endpoint, { method: 'POST', body })
      setMessage(result?.message || 'Operación registrada correctamente.'); setForm({}); setItems([newLine()])
    } catch (e2) { setError(e2.message) } finally { setSaving(false) }
  }
  return <><div className="mb-6"><p className="text-sm font-semibold text-brand-600">Operación</p><h1 className="text-3xl font-bold">{title}</h1></div>
    <form onSubmit={submit} className="card max-w-4xl"><div className="grid gap-4 sm:grid-cols-2">{fields.map(field => <label key={field.name}><span className="mb-1.5 block text-sm font-medium">{field.label}{field.required && ' *'}</span>{field.type === 'select' && field.searchable ? <SearchableSelect field={field} options={lookups[field.source] || []} value={form[field.name]} onChange={value => setForm({ ...form, [field.name]: value })}/> : field.type === 'select' ? <select className="input" required={field.required} value={form[field.name] || ''} onChange={e => setForm({ ...form, [field.name]: e.target.value })}><option value="">Seleccionar…</option>{(lookups[field.source] || []).map(o => <option value={o[field.valueKey]} key={o[field.valueKey]}>{field.labelKeys.map(k => o[k]).filter(Boolean).join(' ')}</option>)}</select> : <input className="input" type={field.type || 'text'} min={field.min} step={field.step} required={field.required} readOnly={field.readOnly || Boolean(field.calculate)} value={field.calculate ? field.calculate(form) : (form[field.name] || '')} onChange={e => setForm({ ...form, [field.name]: e.target.value })}/>}</label>)}</div>
      {lines && <div className="mt-6 border-t pt-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Detalle de venta</h2><button type="button" className="btn-secondary" onClick={() => setItems([...items, newLine()])}><Plus size={17}/>Agregar línea</button></div>{items.map((item, index) => <div className="mb-3 grid items-end gap-3 rounded-xl bg-blue-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]" key={index}><label><span className="text-xs text-slate-500">Cantidad</span><input className="input" type="number" min="1" required value={item.cantidad} onChange={e => setItems(items.map((x,i) => i === index ? {...x,cantidad:e.target.value}:x))}/></label><label><span className="text-xs text-slate-500">Precio unitario</span><input className="input" type="number" min="0.01" step="0.01" required value={item.valorUnidad} onChange={e => setItems(items.map((x,i) => i === index ? {...x,valorUnidad:e.target.value}:x))}/></label><p className="pb-2 font-semibold">Q {(Number(item.cantidad)*Number(item.valorUnidad)).toFixed(2)}</p><button type="button" className="mb-1 rounded-lg p-2 text-red-600" disabled={items.length === 1} onClick={() => setItems(items.filter((_,i) => i !== index))}><Trash2 size={18}/></button></div>)}<p className="text-right text-xl font-bold">Total: Q {total.toFixed(2)}</p></div>}
      {message && <p className="mt-5 flex gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2/>{message}</p>}{error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}<div className="mt-6 flex justify-end"><button className="btn-primary" disabled={saving}>{saving && <LoaderCircle size={18} className="animate-spin"/>}Registrar</button></div>
    </form></>
}
