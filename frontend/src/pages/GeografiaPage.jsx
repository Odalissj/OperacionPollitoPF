import { useState } from 'react'
import { CrudPage } from '../components/CrudPage'
import { resources } from '../config/resources'

const tabs = [
  { key: 'paises', label: 'Países' },
  { key: 'departamentos', label: 'Departamentos' },
  { key: 'municipios', label: 'Municipios' },
  { key: 'lugares', label: 'Lugares' },
]

export function GeografiaPage({ initialTab = 'lugares' }) {
  const [active, setActive] = useState(initialTab)
  return <>
    <div className="mb-5"><p className="text-sm font-semibold text-brand-600">Catálogos geográficos</p><h1 className="text-3xl font-bold">Ubicaciones</h1><p className="mt-1 text-slate-500">Registra la jerarquía en orden: país, departamento, municipio y lugar.</p></div>
    <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map(tab => <button key={tab.key} onClick={() => setActive(tab.key)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active === tab.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{tab.label}</button>)}
    </div>
    <CrudPage key={active} resource={active} config={resources[active]}/>
  </>
}
