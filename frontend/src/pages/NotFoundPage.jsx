import { Link } from 'react-router-dom'
export function NotFoundPage() { return <div className="grid min-h-[70vh] place-items-center text-center"><div><p className="text-7xl font-black text-brand-600">404</p><h1 className="mt-4 text-2xl font-bold">Página no encontrada</h1><Link className="btn-primary mt-6" to="/">Volver al inicio</Link></div></div> }
