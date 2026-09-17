const text = (name, label, required = false, extra = {}) => ({ name, label, required, ...extra })
const select = (name, label, source, valueKey, labelKeys, required = true, extra = {}) => ({ name, label, type: 'select', source, valueKey, labelKeys, required, ...extra })

export const resources = {
  roles: {
    title: 'Roles', idKey: 'idRol',
    fields: [text('nombreRol', 'Nombre', true), text('descripcionRol', 'Descripción', true)],
  },
  usuarios: {
    title: 'Usuarios', idKey: 'idUsuario', fetchDetail: false,
    fields: [text('nombreUsuario', 'Usuario', true, { maxLength: 50 }), text('correoUsuario', 'Correo', false, { type: 'email' }), text('contrasena', 'Contraseña', false, { type: 'password', requiredOnCreate: true, minLength: 8 }), select('idRol', 'Rol', 'roles', 'idRol', ['nombreRol']), { name: 'estadoUsuario', label: 'Estado', type: 'options', options: [{ value: 'A', label: 'Activo' }, { value: 'I', label: 'Inactivo' }], required: true }],
  },
  paises: {
    title: 'Países', idKey: 'idPais', fields: [text('nombrePais', 'Nombre del país', true)],
  },
  departamentos: {
    title: 'Departamentos', idKey: 'idDepartamento', fields: [select('idPaisDepa', 'País', 'paises', 'idPais', ['nombrePais']), text('nombreDepartamento', 'Departamento', true)],
  },
  municipios: {
    title: 'Municipios', idKey: 'idMunicipio', fields: [select('idPaisMuni', 'País', 'paises', 'idPais', ['nombrePais']), select('idDepartamentoMuni', 'Departamento', 'departamentos', 'idDepartamento', ['nombreDepartamento'], true, { dependsOn: { field: 'idPaisMuni', optionKey: 'idPaisDepa' } }), text('nombreMunicipio', 'Municipio', true)],
  },
  lugares: {
    title: 'Lugares', idKey: 'idLugar', fields: [select('idPaisLugar', 'País', 'paises', 'idPais', ['nombrePais']), select('idDepartamentoLugar', 'Departamento', 'departamentos', 'idDepartamento', ['nombreDepartamento'], true, { dependsOn: { field: 'idPaisLugar', optionKey: 'idPaisDepa' } }), select('idMunicipioLugar', 'Municipio', 'municipios', 'idMunicipio', ['nombreMunicipio'], true, { dependsOn: { field: 'idDepartamentoLugar', optionKey: 'idDepartamentoMuni' } }), text('nombreLugar', 'Lugar', true), text('referenciaGeneral', 'Referencia general')],
  },
  encargados: {
    title: 'Encargados', idKey: 'idEncargado', userCreate: 'idUsuarioIngreso', userUpdate: 'idUsuarioActualiza',
    fields: [
      text('IdentificacionEncarga', 'Identificación personal (opcional)'), text('nombre1Encargado', 'Primer nombre', true), text('nombre2Encargado', 'Segundo nombre'), text('nombre3Encargado', 'Tercer nombre'),
      text('apellido1Encargado', 'Primer apellido', true), text('apellido2Encargado', 'Segundo apellido'), text('apellido3Encargado', 'Apellido de casada'),
      text('telefonoEncargado', 'Teléfono', false, { type: 'tel', pattern: '\\+?[0-9() -]{8,20}', title: 'Ingresa entre 8 y 15 dígitos; puedes usar +, espacios, guiones o paréntesis.' }), text('correoEncargado', 'Correo', false, { type: 'email' }),
      select('idPaisEncargado', 'País', 'paises', 'idPais', ['nombrePais']), select('idDepartamentoEncargado', 'Departamento', 'departamentos', 'idDepartamento', ['nombreDepartamento'], true, { dependsOn: { field: 'idPaisEncargado', optionKey: 'idPaisDepa' } }), select('idMuniEncarga', 'Municipio', 'municipios', 'idMunicipio', ['nombreMunicipio'], true, { dependsOn: { field: 'idDepartamentoEncargado', optionKey: 'idDepartamentoMuni' } }), select('idLugarEncargado', 'Lugar', 'lugares', 'idLugar', ['nombreLugar'], true, { dependsOn: { field: 'idMuniEncarga', optionKey: 'idMunicipioLugar' } }),
    ],
  },
  beneficiarios: {
    title: 'Beneficiarios', idKey: 'idBeneficiario', userCreate: 'idUsuarioIngreso', userUpdate: 'idUsuarioActualiza', afterCreate: '/inventario',
    fields: [
      text('numeroIdentificacion', 'Identificación personal (opcional)'),
      text('nombre1Beneficiario', 'Primer nombre', true), text('nombre2Beneficiario', 'Segundo nombre'), text('nombre3Beneficiario', 'Tercer nombre'),
      text('apellido1Beneficiario', 'Primer apellido', true), text('apellido2Beneficiario', 'Segundo apellido'), text('apellido3Beneficiario', 'Apellido de casada'), text('nombreConocidoComo', 'Conocido como'),
      text('fechaNacimiento', 'Fecha de nacimiento', false, { type: 'date' }), text('anioNacimientoAprox', 'Año aproximado de nacimiento', false, { type: 'number' }),
      select('idEncargadoBene', 'Encargado', 'encargados', 'idEncargado', ['nombreCompleto'], false, { searchable: true }), select('idPaisBene', 'País', 'paises', 'idPais', ['nombrePais']),
      select('idDepartamentoBene', 'Departamento', 'departamentos', 'idDepartamento', ['nombreDepartamento'], true, { dependsOn: { field: 'idPaisBene', optionKey: 'idPaisDepa' } }), select('idMunicipioBene', 'Municipio', 'municipios', 'idMunicipio', ['nombreMunicipio'], true, { dependsOn: { field: 'idDepartamentoBene', optionKey: 'idDepartamentoMuni' } }), select('idLugarBene', 'Lugar', 'lugares', 'idLugar', ['nombreLugar'], true, { dependsOn: { field: 'idMunicipioBene', optionKey: 'idMunicipioLugar' } }),
      text('referenciaUbicacion', 'Referencia de ubicación'), text('observaciones', 'Observaciones'),
      { name: 'estadoBeneficiario', label: 'Estado', type: 'options', required: true, editOnly: true, options: [{ value: 'A', label: 'Activo' }, { value: 'I', label: 'Inactivo' }] },
    ],
  },
  'beneficiario-contactos': {
    title: 'Contactos de beneficiarios', idKey: 'idContactoBeneficiario',
    fields: [
      select('idBeneficiario', 'Beneficiario', 'beneficiarios', 'idBeneficiario', ['nombreCompleto'], true, { searchable: true }),
      text('telefono', 'Teléfono', true, { type: 'tel', pattern: '\\+?[0-9() -]{8,20}', title: 'Ingresa entre 8 y 15 dígitos; puedes usar +, espacios, guiones o paréntesis.' }), text('nombreContacto', 'Nombre del contacto'), text('parentesco', 'Parentesco'),
      { name: 'esPrincipal', label: 'Contacto principal', type: 'options', required: true, options: [{value:1,label:'Sí'},{value:0,label:'No'}] },
      { name: 'activo', label: 'Estado', type: 'options', required: true, options: [{value:1,label:'Activo'},{value:0,label:'Inactivo'}] },
      text('observaciones', 'Observaciones'),
    ],
  },
  donantes: {
    title: 'Donantes', idKey: 'idDonador', userCreate: 'idUsuarioIngreso', userUpdate: 'idUsuarioActualiza',
    fields: [
      text('montoDonacionInicial', 'Monto de la donación inicial', true, { type: 'number', min: '0.01', step: '0.01', createOnly: true }),
      text('nombre1Donante', 'Primer nombre', true), text('nombre2Donante', 'Segundo nombre'), text('nombre3Donante', 'Tercer nombre'), text('apellido1Donante', 'Primer apellido', true), text('apellido2Donante', 'Segundo apellido'), text('apellido3Donante', 'Apellido de casada'), text('telefonoDonante', 'Teléfono', false, { type: 'tel', pattern: '\\+?[0-9() -]{8,20}', title: 'Ingresa entre 8 y 15 dígitos; puedes usar +, espacios, guiones o paréntesis.' }), text('correoDonante', 'Correo', false, { type: 'email' }),
      select('idPaisDonante', 'País', 'paises', 'idPais', ['nombrePais']), select('idDepartamentoDona', 'Departamento', 'departamentos', 'idDepartamento', ['nombreDepartamento'], true, { dependsOn: { field: 'idPaisDonante', optionKey: 'idPaisDepa' } }), select('idMunicipioDona', 'Municipio', 'municipios', 'idMunicipio', ['nombreMunicipio'], true, { dependsOn: { field: 'idDepartamentoDona', optionKey: 'idDepartamentoMuni' } }),
    ],
  },
}
