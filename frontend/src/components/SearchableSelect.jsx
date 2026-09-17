import { useEffect, useMemo, useState } from 'react'

export function SearchableSelect({ field, options, value, onChange }) {
  const labelOf = option => field.labelKeys.map(key => option[key]).filter(Boolean).join(' ')
  const selected = options.find(option => String(option[field.valueKey]) === String(value || ''))
  const [search, setSearch] = useState(selected ? labelOf(selected) : '')
  const [open, setOpen] = useState(false)

  useEffect(() => { setSearch(selected ? labelOf(selected) : '') }, [value, options.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => options.filter(option => labelOf(option).toLowerCase().includes(search.toLowerCase())).slice(0, 20), [options, search]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="relative">
    <input className="input" required={field.required} placeholder="Escribe para buscar…" value={search} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onChange={event => { setSearch(event.target.value); onChange(''); setOpen(true) }}/>
    {open && <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-blue-100 bg-white p-1 shadow-xl">
      {filtered.map(option => <button type="button" key={option[field.valueKey]} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-50" onMouseDown={() => { onChange(option[field.valueKey]); setSearch(labelOf(option)); setOpen(false) }}>{labelOf(option)}</button>)}
      {!filtered.length && <p className="px-3 py-2 text-sm text-slate-500">No se encontraron resultados.</p>}
    </div>}
  </div>
}
