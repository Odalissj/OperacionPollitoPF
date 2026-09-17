import { useEffect, useState } from 'react'
import { CrudPage } from '../components/CrudPage'
import { resources } from '../config/resources'

const tabs = [
  { key: 'beneficiarios', label: 'Beneficiarios' },
  { key: 'encargados', label: 'Encargados' },
  { key: 'beneficiario-contactos', label: 'Contactos' },
]

export function PersonasPage({ initialTab = 'beneficiarios' }) {
  const [active, setActive] = useState(initialTab)
  const [newEncargadoId, setNewEncargadoId] = useState('')

  useEffect(() => {
    setActive(initialTab)
  }, [initialTab])

  return <>
    <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map(tab => <button key={tab.key} onClick={() => setActive(tab.key)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active === tab.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{tab.label}</button>)}
    </div>
    <CrudPage key={active} resource={active} config={resources[active]} initialValues={active === 'beneficiarios' ? { idEncargadoBene: newEncargadoId } : {}} onCreated={(result) => { if (active === 'encargados') { setNewEncargadoId(result?.idEncargado || ''); setActive('beneficiarios') } }}/>
  </>
}
