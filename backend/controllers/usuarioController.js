// controllers/UsuarioController.js

const UsuarioModel = require('../models/usuarioModel');
// Asumo que tienes una función para la Bitácora, la usaremos aquí
const BitacoraModel = require('../models/bitacoraModel'); 
const pool = require('../config/dbconfig');        // 👈 te falta esto
const bcrypt = require('bcryptjs');  
/**
 * Controlador para la gestión de Usuarios.
 * Este controlador es clave para la autenticación y el manejo de roles.
 */
class UsuarioController {

    /**
     * Obtiene todos los usuarios. (GET /api/usuarios)
     */
    static async getAllUsuarios(req, res) {
        try {
            const usuarios = await UsuarioModel.findAll();
            // Evitar exponer el hash de la contraseña si se usara el findByUsername()
            // En findAll(), el modelo ya evita la contraseña.
            res.status(200).json(usuarios);
        } catch (error) {
            console.error('Error al obtener usuarios:', error.message);
            res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
        }
    }

    /**
     * Obtiene un usuario por ID. (GET /api/usuarios/:id)
     */
    static async getUsuarioById(req, res) {
        try {
            const { id } = req.params;
            const usuario = await UsuarioModel.findById(id);

            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }
            res.status(200).json(usuario);
        } catch (error) {
            console.error('Error al obtener usuario por ID:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    /**
     * Crea un nuevo usuario. (POST /api/usuarios)
     */
    static async createUsuario(req, res) {
        try {
            const { contrasena, idRol, estadoUsuario = 'A' } = req.body;
            const nombreUsuario = String(req.body.nombreUsuario || '').trim();
            const correoUsuario = String(req.body.correoUsuario || '').trim() || null;

            if (!nombreUsuario || !contrasena || !idRol) {
                return res.status(400).json({ message: 'El nombre de usuario, la contraseña y el ID de rol son obligatorios.' });
            }

            if (await UsuarioModel.findByUsername(nombreUsuario)) {
                return res.status(409).json({ message: 'El nombre de usuario ya está registrado.' });
            }
            if (correoUsuario && await UsuarioModel.findAnyByEmail(correoUsuario)) {
                return res.status(409).json({ message: 'El correo electrónico ya está registrado para otro usuario.' });
            }

            const id = await UsuarioModel.create({ nombreUsuario, contrasena, correoUsuario, idRol, estadoUsuario });

            // REGISTRO EN BITÁCORA
            await BitacoraModel.create({
                idUsuario: id, // El usuario que se crea
                accion: 'INSERT',
                tabla: 'usuarios',
                pk_afectada: id.toString(),
                descripcion: `Creación del usuario: ${nombreUsuario}`
            });

            res.status(201).json({ 
                message: 'Usuario creado con éxito.', 
                idUsuario: id 
            });
        } catch (error) {
            console.error('Error al crear usuario:', error.message);
            if (error.code === 'ER_DUP_ENTRY') {
                const isEmail = /correo|uk_usuarios_correo/i.test(error.sqlMessage || error.message);
                return res.status(409).json({ message: isEmail ? 'El correo electrónico ya está registrado para otro usuario.' : 'El nombre de usuario ya está registrado.' });
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ message: 'El ID de rol proporcionado no existe.' });
            }
            res.status(500).json({ message: 'Error interno del servidor al crear usuario.' });
        }
    }

    /**
     * Actualiza un usuario. (PUT /api/usuarios/:id)
     */
    static async updateUsuario(req, res) {
        try {
            const { id } = req.params;
            const { contrasena, idRol, estadoUsuario = 'A' } = req.body;
            const nombreUsuario = String(req.body.nombreUsuario || '').trim();
            const correoUsuario = String(req.body.correoUsuario || '').trim() || null;

            if (!nombreUsuario || !idRol) {
                return res.status(400).json({ message: 'El nombre de usuario y el ID de rol son obligatorios.' });
            }
            const sameName = await UsuarioModel.findByUsername(nombreUsuario);
            if (sameName && Number(sameName.idUsuario) !== Number(id)) {
                return res.status(409).json({ message: 'El nombre de usuario ya está registrado.' });
            }
            const sameEmail = correoUsuario ? await UsuarioModel.findAnyByEmail(correoUsuario) : null;
            if (sameEmail && Number(sameEmail.idUsuario) !== Number(id)) {
                return res.status(409).json({ message: 'El correo electrónico ya está registrado para otro usuario.' });
            }
            
            // Lógica: Solo se actualiza la contraseña si se provee un valor
            const affectedRows = await UsuarioModel.update(id, { nombreUsuario, contrasena, correoUsuario, idRol, estadoUsuario });

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado o datos idénticos.' });
            }
            
            // REGISTRO EN BITÁCORA
            await BitacoraModel.create({
                idUsuario: id, 
                accion: 'UPDATE',
                tabla: 'usuarios',
                pk_afectada: id.toString(),
                descripcion: `Actualización de datos del usuario: ${nombreUsuario}`
            });

            res.status(200).json({ message: 'Usuario actualizado con éxito.' });
        } catch (error) {
            console.error('Error al actualizar usuario:', error.message);
            if (error.code === 'ER_DUP_ENTRY') {
                const isEmail = /correo|uk_usuarios_correo/i.test(error.sqlMessage || error.message);
                return res.status(409).json({ message: isEmail ? 'El correo electrónico ya está registrado para otro usuario.' : 'El nombre de usuario ya está registrado.' });
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ message: 'El ID de rol proporcionado no existe.' });
            }
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    /**
     * Elimina un usuario. (DELETE /api/usuarios/:id)
     */
    static async deleteUsuario(req, res) {
        try {
            const { id } = req.params;
            const affectedRows = await UsuarioModel.delete(id);

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }

            // REGISTRO EN BITÁCORA (El idUsuario se pone en NULL si se borra el usuario)
            await BitacoraModel.create({
                idUsuario: null, 
                accion: 'DELETE',
                tabla: 'usuarios',
                pk_afectada: id,
                descripcion: `Usuario ID ${id} ha sido eliminado.`,
                // Se podría usar datos_antes para guardar el objeto del usuario antes de borrar
            });
            
            res.status(200).json({ message: 'Usuario eliminado con éxito.' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error.message);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ message: 'No se puede eliminar el usuario porque está asociado a registros de auditoría o transacciones.' });
            }
            res.status(500).json({ message: 'Error interno del servidor al eliminar usuario.' });
        }
    }
    // PUT /api/usuarios/:id/password
// PUT /api/usuarios/:id/password
static async updatePassword(req, res) {
  try {
    const { id } = req.params;
    const { contrasena } = req.body;

    if (!contrasena || contrasena.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Usar la misma lógica de hash del modelo
    const hash = await UsuarioModel.hashPassword(contrasena);

    const [result] = await pool.query(
      `UPDATE usuarios SET contrasena = ? WHERE idUsuario = ?`,
      [hash, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Registrar en bitácora el cambio de contraseña (sin poner la contraseña, obvio)
    await BitacoraModel.create({
      idUsuario: id,
      accion: 'UPDATE',
      tabla: 'usuarios',
      pk_afectada: id.toString(),
      descripcion: `Cambio de contraseña del usuario ID ${id}`
    });

    return res.status(200).json({ message: 'Contraseña actualizada.' });

  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Error interno.' });
  }
}


}

module.exports = UsuarioController;
