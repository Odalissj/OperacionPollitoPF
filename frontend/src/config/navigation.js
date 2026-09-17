import { Banknote, Boxes, Building2, HandCoins, HeartHandshake, Home, MapPin, PackageCheck, ReceiptText, Shield, ShoppingCart, Truck, Users } from 'lucide-react'

export const navigation = [
  { label: 'Inicio', path: '/', icon: Home },
  {
    label: 'Beneficiarios', path: '/beneficiarios', icon: HeartHandshake,
    children: [
      { label: 'Inventario', path: '/inventario/historial', icon: Boxes },
    ],
  },
  { label: 'Encargados', path: '/encargados', icon: Users },
  {
    label: 'Donaciones', icon: HandCoins,
    children: [
      { label: 'Donantes', path: '/donantes', icon: HandCoins },
      { label: 'Registrar donación', path: '/donaciones/nueva', icon: PackageCheck, writeOnly: true },
      { label: 'Historial de donaciones', path: '/donaciones/historial', icon: ReceiptText },
    ],
  },
  {
    label: 'Compras', icon: ShoppingCart,
    children: [
      { label: 'Registrar compra', path: '/compras/nueva', icon: ShoppingCart, writeOnly: true },
      { label: 'Historial de compras', path: '/compras/historial', icon: ReceiptText },
    ],
  },
  {
    label: 'Ventas', icon: ReceiptText,
    children: [
      { label: 'Registrar venta', path: '/ventas/nueva', icon: ReceiptText, writeOnly: true },
      { label: 'Historial de ventas', path: '/ventas/historial', icon: ReceiptText },
    ],
  },
  { label: 'Inventario Iglesia', path: '/inventario-general', icon: Building2,
    children: [{ label: 'Movimientos', path: '/inventario-general/movimientos', icon: ReceiptText }],
  },
  { label: 'Entrega', path: '/entrega', icon: Truck, writeOnly: true },
  { label: 'Caja', path: '/caja', icon: Banknote },
  { label: 'Ubicaciones', path: '/ubicaciones', icon: MapPin },
  { label: 'Usuarios', path: '/usuarios', icon: Shield, adminOnly: true },
  { label: 'Roles', path: '/roles', icon: Building2, adminOnly: true },
]
