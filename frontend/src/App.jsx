import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResourcePage } from './pages/ResourcePage'
import { CrudPage } from './components/CrudPage'
import { OperationPage } from './components/OperationPage'
import { resources } from './config/resources'
import { CajaPage } from './pages/CajaPage'
import { ProgressPage } from './pages/ProgressPage'
import { PersonasPage } from './pages/PersonasPage'
import { GeografiaPage } from './pages/GeografiaPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

const personCrud = ['donantes', 'usuarios', 'roles']
const history = ['compras', 'ventas', 'donaciones', 'bitacora', 'login-attempts', 'transacciones-caja']
const select = (name, label, source, valueKey, labelKeys) => ({ name, label, source, valueKey, labelKeys, type: 'select', required: true, searchable: ['beneficiarios', 'encargados', 'donantes'].includes(source) })

export function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/recuperar-contrasena" element={<ForgotPasswordPage/>}/>
    <Route path="/restablecer-contrasena" element={<ResetPasswordPage/>}/>
    <Route element={<ProtectedRoute/>}><Route element={<AppLayout/>}>
      <Route index element={<DashboardPage/>}/>
      {personCrud.map(resource => <Route key={resource} path={resource} element={<CrudPage resource={resource} config={resources[resource]}/>}/>) }
      <Route path="beneficiarios" element={<PersonasPage initialTab="beneficiarios"/>}/>
      <Route path="encargados" element={<PersonasPage initialTab="encargados"/>}/>
      <Route path="beneficiario-contactos" element={<PersonasPage initialTab="beneficiario-contactos"/>}/>
      {history.map(resource => <Route key={resource} path={resource === 'inventario-general' ? resource : `${resource}/historial`} element={<ResourcePage resource={resource}/>}/>) }
      <Route path="inventario/historial" element={<ResourcePage resource="inventario" title="Inventario por beneficiario"/>}/>
      <Route path="inventario-general" element={<ResourcePage resource="inventario-general" title="Inventario de la iglesia"/>}/>
      <Route path="inventario-general/movimientos" element={<ResourcePage resource="inventario-general/movimientos" title="Movimientos del inventario de la iglesia"/>}/>
      <Route path="donaciones/nueva" element={<OperationPage title="Registrar donación" description="Registra un aporte y actualiza automáticamente la caja." endpoint="/donaciones" fields={[select('idDonador','Donante','donantes','idDonador',['nombreCompleto']),{name:'montoDonado',label:'Monto donado',type:'number',min:'0.01',step:'0.01',required:true}]} transform={base=>({idDonador:Number(base.idDonador),montoDonado:Number(base.montoDonado),idUsuarioIngreso:base.idUsuarioIngreso})}/>}/>
      <Route path="compras/nueva" element={<OperationPage title="Registrar compra" description="La compra se registra automáticamente en la caja general." endpoint="/compras" fields={[{name:'cantidadCompra',label:'Cantidad',type:'number',min:'1',required:true},{name:'precioUnitario',label:'Precio unitario',type:'number',min:'0.01',step:'0.01',required:true},{name:'totalCompra',label:'Total calculado',type:'number',step:'0.01',readOnly:true,calculate:form=>(Number(form.cantidadCompra||0)*Number(form.precioUnitario||0)).toFixed(2)}]} transform={base=>({cantidadCompra:Number(base.cantidadCompra),precioUnitario:Number(base.precioUnitario),idUsuarioIngresa:base.idUsuarioIngresa})}/>}/>
      <Route path="ventas/nueva" element={<OperationPage title="Registrar venta" description="Agrega una o varias líneas a la venta. El precio predeterminado es Q60.00." endpoint="/ventas" lines lineUnitPrice={60} fields={[select('idBeneficiarioVenta','Beneficiario','beneficiarios','idBeneficiario',['nombreCompleto'])]} transform={(base,items,total)=>({idBeneficiarioVenta:Number(base.idBeneficiarioVenta),TotalVenta:total,idUsuarioIngresa:base.idUsuarioIngresa,detalles:items.map(i=>({cantidad:Number(i.cantidad),valorUnidad:Number(i.valorUnidad),subtotal:Number(i.cantidad)*Number(i.valorUnidad)}))})}/>}/>
      <Route path="inventario/inicializar" element={<OperationPage title="Inicializar inventario" description="Crea el inventario individual de un beneficiario." endpoint="/inventario" fields={[select('idBeneficiario','Beneficiario','beneficiarios','idBeneficiario',['nombreCompleto']),{name:'cantidadInicial',label:'Cantidad inicial',type:'number',min:'0',required:true}]} transform={base=>({idBeneficiario:Number(base.idBeneficiario),cantidadInicial:Number(base.cantidadInicial),idUsuarioIngreso:base.idUsuarioIngreso})}/>}/>
      <Route path="entrega" element={<OperationPage title="Entrega de pollitos" description="Transfiere existencias del inventario general a un beneficiario." endpoint="/inventario/entregar" fields={[select('idBeneficiario','Beneficiario','beneficiarios','idBeneficiario',['nombreCompleto']),{name:'cantidad',label:'Cantidad',type:'number',min:'1',required:true}]} transform={base=>({idBeneficiario:Number(base.idBeneficiario),cantidad:Number(base.cantidad),idUsuario:base.idUsuario})}/>}/>
      <Route path="caja" element={<CajaPage/>}/>
      <Route path="progreso" element={<ProgressPage/>}/>
      <Route path="ubicaciones" element={<GeografiaPage/>}/>
      <Route path="ubicaciones/paises" element={<GeografiaPage initialTab="paises"/>}/>
      <Route path="ubicaciones/departamentos" element={<GeografiaPage initialTab="departamentos"/>}/>
      <Route path="ubicaciones/municipios" element={<GeografiaPage initialTab="municipios"/>}/>
      <Route path="*" element={<NotFoundPage/>}/>
    </Route></Route>
  </Routes>
}
