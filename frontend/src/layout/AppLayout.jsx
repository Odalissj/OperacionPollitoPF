import { useState } from 'react'
import { ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { navigation } from '../config/navigation'
import logo from '../../../legacy-frontend/img/Sonrisas.png'

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set())
  const { user, logout } = useAuth()
  const location = useLocation()
  const allowed = item => (!item.adminOnly || Number(user?.idRol) === 1) && (!item.writeOnly || Number(user?.idRol) !== 3)
  const toggle = label => setExpanded(current => {
    const next = new Set(current)
    if (next.has(label)) next.delete(label); else next.add(label)
    return next
  })
  const linkClass = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-yellow-400 font-semibold text-blue-950' : 'text-blue-100 hover:bg-blue-800 hover:text-white'}`
  return <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
    <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-68 flex-col bg-blue-950 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0`}>
      <div className="flex min-h-24 items-center justify-between border-b border-blue-800 px-4 py-2">
        <div className="flex items-center gap-3"><span className="grid size-16 place-items-center rounded-xl bg-white p-1"><img src={logo} alt="Logo Proyecto Sonrisas" className="max-h-full max-w-full object-contain"/></span><div><p className="font-bold text-yellow-300">Operación Pollito</p><p className="text-xs text-blue-200">Proyecto Sonrisas</p></div></div>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.filter(allowed).map(item => {
          const Icon = item.icon
          if (!item.children) return <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => setOpen(false)} className={linkClass}><Icon size={18}/>{item.label}</NavLink>
          const isExpanded = expanded.has(item.label)
          const childActive = item.children.some(child => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`))
          return <div key={item.label} className="rounded-xl">
            <div className={`flex items-center rounded-xl transition ${childActive ? 'bg-blue-900' : 'hover:bg-blue-900/70'}`}>
              {item.path ? <NavLink to={item.path} onClick={() => setOpen(false)} className={({ isActive }) => `flex min-w-0 flex-1 items-center gap-3 rounded-l-xl px-3 py-2.5 text-sm ${isActive ? 'font-semibold text-yellow-300' : 'text-blue-100'}`}><Icon size={18}/><span>{item.label}</span></NavLink> : <button type="button" onClick={() => toggle(item.label)} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-blue-100"><Icon size={18}/><span>{item.label}</span></button>}
              <button type="button" onClick={() => toggle(item.label)} className="p-2.5 text-blue-200" aria-label={`${isExpanded ? 'Contraer' : 'Expandir'} ${item.label}`}><ChevronDown size={17} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}/></button>
            </div>
            {isExpanded && <div className="ml-5 mt-1 space-y-1 border-l border-blue-700 pl-2">{item.children.filter(allowed).map(child => { const ChildIcon = child.icon; return <NavLink key={child.path} to={child.path} onClick={() => setOpen(false)} className={linkClass}><ChildIcon size={16}/>{child.label}</NavLink> })}</div>}
          </div>
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-medium">{user?.nombreUsuario}</p>
        <button onClick={logout} className="mt-3 flex w-full items-center gap-2 text-sm text-slate-300 hover:text-white"><LogOut size={17}/>Cerrar sesión</button>
      </div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}
    <div className="min-w-0">
      <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden"><button onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu /></button><span className="ml-3 font-semibold">Operación Pollito</span></header>
      <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8"><Outlet /></main>
    </div>
  </div>
}
