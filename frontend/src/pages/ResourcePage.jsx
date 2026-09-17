import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Eye, LoaderCircle, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { api } from '../lib/api'

const hidden = new Set(['contrasena', 'password', 'token_hash', 'refreshToken'])
const labels = { beneficiarios: 'Beneficiarios', encargados: 'Encargados', donantes: 'Donantes', donaciones: 'Donaciones', compras: 'Compras', ventas: 'Ventas', inventario: 'Inventario', 'inventario-general': 'Inventario general', ubicaciones: 'Ubicaciones', usuarios: 'Usuarios', roles: 'Roles' }

function rowsFrom(value) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  return Object.values(value).find(Array.isArray) || []
}

function display(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
    .replace(/\b(Venta|Beneficiario|Usuario|Encargado|Donante)\s+ID\s*\d+\b/gi, '$1')
}

export function ResourcePage({ resource, title, description }) {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [query, setQuery] = useState(''), [detail, setDetail] = useState(null)
  async function load() { setLoading(true); setError(''); try { setRows(rowsFrom(await api(`/${resource}`))) } catch (e) { setError(e.message) } finally { setLoading(false) } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [resource])
  const columns = useMemo(() => [...new Set(rows.flatMap(row => Object.keys(row || {})))].filter(key => !hidden.has(key) && !/^id[A-Z_]|^id$/i.test(key)).slice(0, 8), [rows])
  const filtered = useMemo(() => rows.filter(row => Object.values(row).some(value => display(value).toLowerCase().includes(query.toLowerCase()))), [rows, query])
  const idKey = resource === 'donaciones' ? 'idDonacion' : null
  async function openDetail(row) { try { setDetail(await api(`/${resource}/${row[idKey]}`)) } catch (e) { setError(e.message) } }
  async function remove(row) { if (!confirm('¿Eliminar esta donación?')) return; try { await api(`/donaciones/${row.idDonacion}`, { method: 'DELETE' }); await load() } catch (e) { setError(e.message) } }
  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-brand-600">Gestión</p><h1 className="text-3xl font-bold">{title || labels[resource] || resource}</h1>{description && <p className="mt-1 text-slate-500">{description}</p>}</div><button className="btn-secondary" onClick={load}><RefreshCw size={17}/>Actualizar</button></div>
    <section className="card overflow-hidden p-0"><div className="border-b border-slate-200 p-4"><label className="relative block max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={19}/><input className="input pl-10" placeholder="Buscar en los resultados…" value={query} onChange={e => setQuery(e.target.value)}/></label></div>
      {loading ? <div className="grid min-h-56 place-items-center text-slate-500"><LoaderCircle className="animate-spin"/></div> : error ? <div className="m-5 flex gap-3 rounded-xl bg-red-50 p-4 text-red-700"><AlertCircle/><div><p className="font-semibold">No fue posible cargar los datos</p><p className="text-sm">{error}</p></div></div> : !filtered.length ? <div className="grid min-h-56 place-items-center text-slate-500">No hay registros para mostrar.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{columns.map(c => <th className="whitespace-nowrap px-4 py-3" key={c}>{c.replace(/([A-Z])/g, ' $1')}</th>)}{idKey&&<th className="px-4 py-3 text-right">Acciones</th>}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((row, index) => <tr className="hover:bg-orange-50/40" key={row.id || row.idUsuario || row.idBeneficiario || index}>{columns.map(c => <td className="max-w-64 truncate px-4 py-3" key={c} title={display(row[c])}>{display(row[c])}</td>)}{idKey&&<td className="whitespace-nowrap px-4 py-2 text-right"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={()=>openDetail(row)} title="Ver detalle"><Eye size={17}/></button>{resource==='donaciones'&&<button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={()=>remove(row)} title="Eliminar"><Trash2 size={17}/></button>}</td>}</tr>)}</tbody></table></div>}
    </section>
    {detail&&<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4"><div className="mx-auto my-8 max-w-2xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><h2 className="text-xl font-bold">Detalle</h2><button onClick={()=>setDetail(null)}><X/></button></div><dl className="grid gap-4 p-5 sm:grid-cols-2">{Object.entries(detail).filter(([key])=>!/^id[A-Z_]|^id$/i.test(key)).map(([key,value])=><div key={key} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase text-slate-500">{key.replace(/([A-Z])/g,' $1')}</dt><dd className="mt-1 break-words text-sm">{display(value)}</dd></div>)}</dl></div></div>}
  </>
}
