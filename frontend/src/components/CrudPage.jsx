import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, LoaderCircle, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { SearchableSelect } from './SearchableSelect'

const rowsFrom = value => Array.isArray(value) ? value : (value && Object.values(value).find(Array.isArray)) || []
const show = value => value == null || value === '' ? '—' : String(value)

export function CrudPage({ config, resource, onCreated, initialValues = {} }) {
  const { user } = useAuth()
  const canWrite = Number(user?.idRol) !== 3
  const [rows, setRows] = useState([]), [lookups, setLookups] = useState({}), [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null), [form, setForm] = useState({}), [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('')
  const visibleFields = config.fields.filter(field => !(editing && field.createOnly) && !(!editing && field.editOnly))

  async function load() {
    setLoading(true); setError('')
    try {
      const sources = [...new Set(config.fields.map(field => field.source).filter(Boolean))]
      const [data, ...lookupData] = await Promise.all([api(`/${resource}`), ...sources.map(source => api(`/${source}`))])
      setRows(rowsFrom(data))
      setLookups(Object.fromEntries(sources.map((source, index) => [source, rowsFrom(lookupData[index])])))
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [resource]) // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo(() => [...new Set(rows.flatMap(row => Object.keys(row)))].filter(key => !/^id[A-Z_]|^id$|contrasena|token|password/i.test(key)).slice(0, 7), [rows])
  const filtered = rows.filter(row => Object.values(row).some(value => show(value).toLowerCase().includes(query.toLowerCase())))
  const modalOpen = editing !== null || Object.keys(form).length > 0

  async function open(row = null) {
    setError(''); setMessage('')
    let detail = row
    if (row && config.fetchDetail !== false) {
      try { detail = await api(`/${resource}/${row[config.idKey]}`) } catch (e) { setError(e.message); return }
    }
    setEditing(detail)
    setForm(Object.fromEntries(config.fields.map(field => [field.name, detail?.[field.name] ?? initialValues[field.name] ?? (field.options?.[0]?.value ?? '')])))
  }
  function close() { setEditing(null); setForm({}); setError('') }

  function change(field, value) {
    const next = { ...form, [field.name]: value }
    config.fields.filter(candidate => candidate.dependsOn?.field === field.name).forEach(candidate => { next[candidate.name] = '' })
    setForm(next)
  }
  function optionsFor(field) {
    return (lookups[field.source] || []).filter(option => !field.dependsOn || String(option[field.dependsOn.optionKey]) === String(form[field.dependsOn.field] || ''))
  }

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    const isEdit = Boolean(editing); const body = { ...form }
    if (config.userCreate && !isEdit) body[config.userCreate] = user.idUsuario
    if (config.userUpdate && isEdit) body[config.userUpdate] = user.idUsuario
    try {
      const result = await api(isEdit ? `/${resource}/${editing[config.idKey]}` : `/${resource}`, { method: isEdit ? 'PUT' : 'POST', body })
      close(); setMessage(result?.message || 'Cambios guardados correctamente.'); await load()
      if (!isEdit) onCreated?.(result, body)
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  async function remove(row) {
    if (!confirm('¿Eliminar el registro seleccionado? Esta acción no se puede deshacer.')) return
    try { const result = await api(`/${resource}/${row[config.idKey]}`, { method: 'DELETE' }); setMessage(result?.message || 'Registro eliminado.'); await load() } catch (e) { setError(e.message) }
  }

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-brand-600">Administración</p><h1 className="text-3xl font-bold">{config.title}</h1></div>{canWrite && <button className="btn-primary" onClick={() => open()}><Plus size={18}/>Nuevo registro</button>}</div>
    {message && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    {error && !modalOpen && <p className="mb-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18}/>{error}</p>}
    <section className="card overflow-hidden p-0"><div className="border-b p-4"><label className="relative block max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input className="input pl-10" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar…"/></label></div>
      {loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-brand-600"/></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columns.map(column => <th key={column} className="px-4 py-3">{column.replace(/([A-Z])/g, ' $1')}</th>)}{canWrite && <th className="px-4 py-3 text-right">Acciones</th>}</tr></thead><tbody className="divide-y">{filtered.map((row,index) => <tr key={row[config.idKey] ?? index} className="hover:bg-blue-50/60">{columns.map(column => <td className="max-w-52 truncate px-4 py-3" key={column}>{show(row[column])}</td>)}{canWrite && <td className="whitespace-nowrap px-4 py-2 text-right"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => open(row)}><Pencil size={17}/></button>{resource !== 'beneficiarios' && resource !== 'beneficiario-contactos' && <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(row)}><Trash2 size={17}/></button>}</td>}</tr>)}</tbody></table>{!filtered.length && <p className="p-10 text-center text-slate-500">No hay registros.</p>}</div>}
    </section>
    {modalOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4"><div className="mx-auto my-6 max-w-3xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><h2 className="text-xl font-bold">{editing ? 'Editar' : 'Crear'} {config.title.toLowerCase()}</h2><button onClick={close}><X/></button></div><form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
      {visibleFields.map(field => <label key={field.name}><span className="mb-1.5 block text-sm font-medium">{field.label}{field.required && ' *'}</span>{field.type === 'select' && field.searchable ? <SearchableSelect field={field} options={optionsFor(field)} value={form[field.name]} onChange={value => change(field, value)}/> : field.type === 'select' ? <select className="input" required={field.required} disabled={field.dependsOn && !form[field.dependsOn.field]} value={form[field.name] ?? ''} onChange={e => change(field,e.target.value)}><option value="">Seleccionar…</option>{optionsFor(field).map(option => <option key={option[field.valueKey]} value={option[field.valueKey]}>{field.labelKeys.map(key => option[key]).filter(Boolean).join(' ')}</option>)}</select> : field.type === 'options' ? <select className="input" required={field.required} value={form[field.name] ?? ''} onChange={e => change(field,e.target.value)}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input className="input" name={field.name} type={field.type || 'text'} min={field.min} max={field.max} step={field.step} minLength={field.minLength} maxLength={field.maxLength} pattern={field.pattern} required={field.required || (field.requiredOnCreate && !editing)} value={form[field.name] ?? ''} onChange={e => change(field,e.target.value)}/>}</label>)}
      {error && <p className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-3 sm:col-span-2"><button type="button" className="btn-secondary" onClick={close}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving && <LoaderCircle size={17} className="animate-spin"/>}Guardar</button></div>
    </form></div></div>}
  </>
}
