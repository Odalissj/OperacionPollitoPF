// controllers/AuthController.js

const UsuarioModel      = require('../models/usuarioModel');
const AuthTokenModel    = require('../models/authTokenModel');
const LoginAttemptModel = require('../models/loginAttemptModel');
const BitacoraModel     = require('../models/bitacoraModel');
const crypto = require('crypto');

const jwt = require('jsonwebtoken'); 

const JWT_SECRET          = process.env.JWT_SECRET || 'mi_secreto_super_seguro_e_irrepetible';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

class AuthController {

    static async sendResetEmail(email, resetUrl) {
        if (!process.env.RESEND_API_KEY) {
            console.log(`🔐 Enlace de recuperación (desarrollo): ${resetUrl}`);
            return;
        }
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'Operación Pollito <onboarding@resend.dev>',
                to: [email],
                subject: 'Recuperación de contraseña - Operación Pollito',
                html: `<h2>Recuperación de contraseña</h2><p>Abre el siguiente enlace para crear una contraseña nueva. El enlace vence en 15 minutos y solo puede utilizarse una vez.</p><p><a href="${resetUrl}">Restablecer contraseña</a></p><p>Si no solicitaste este cambio, ignora este mensaje.</p>`
            })
        });
        if (!response.ok) {
            let detail = '';
            try {
                const body = await response.json();
                detail = body?.message ? `: ${body.message}` : '';
            } catch {
                // Si no hay JSON, el código HTTP todavía permite diagnosticarlo.
            }
            throw new Error(`Resend rechazó el correo (${response.status})${detail}`);
        }
    }

    static async forgotPassword(req, res) {
        const genericMessage = 'Si el correo está registrado, recibirás las instrucciones para recuperar tu contraseña.';
        try {
            const email = String(req.body?.email || '').trim();
            if (!email) return res.status(400).json({ message: 'Ingresa tu correo electrónico.' });
            const user = await UsuarioModel.findByEmail(email);
            if (!user) return res.status(200).json({ message: genericMessage });

            await AuthTokenModel.revokeAllUserTokensByType(user.idUsuario, 'reset');
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
            await AuthTokenModel.create({
                idUsuario: user.idUsuario, token_hash: tokenHash, token_type: 'reset', expires_at: expiresAt,
                ip_address: req.ip, user_agent: req.headers['user-agent']
            });
            const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
            await AuthController.sendResetEmail(email, `${frontendUrl}/restablecer-contrasena?token=${rawToken}`);
            return res.status(200).json({ message: genericMessage });
        } catch (error) {
            console.error('Error al solicitar recuperación:', error.message);
            return res.status(500).json({ message: 'No fue posible procesar la recuperación en este momento.' });
        }
    }

    static async resetPassword(req, res) {
        try {
            const token = String(req.body?.token || '');
            const password = String(req.body?.password || '');
            if (!token || password.length < 12) {
                return res.status(400).json({ message: 'El enlace es obligatorio y la contraseña debe tener al menos 12 caracteres.' });
            }
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const record = await AuthTokenModel.findValidByHash(tokenHash);
            if (!record || record.token_type !== 'reset') {
                return res.status(400).json({ message: 'El enlace no es válido, ya fue utilizado o venció.' });
            }
            await UsuarioModel.updatePassword(record.idUsuario, password);
            await AuthTokenModel.revokeById(record.id);
            await AuthTokenModel.revokeAllUserTokensByType(record.idUsuario, 'refresh');
            await BitacoraModel.create({ idUsuario: record.idUsuario, accion: 'UPDATE', tabla: 'usuarios', pk_afectada: String(record.idUsuario), descripcion: 'Contraseña restablecida mediante enlace de recuperación.' });
            return res.status(200).json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
        } catch (error) {
            console.error('Error al restablecer contraseña:', error.message);
            return res.status(500).json({ message: 'No fue posible restablecer la contraseña.' });
        }
    }

    static generateTokens(idUsuario, nombreUsuario, idRol) {
        const payload = { idUsuario, nombreUsuario, idRol };
        
        const accessToken  = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
        
        return { accessToken, refreshToken };
    }

static async login(req, res) {
        const { nombreUsuario, contrasena } = req.body;
        const ip_address = req.ip;
        const user_agent = req.headers['user-agent'];
        
        if (!nombreUsuario || !contrasena) {
            return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios.' });
        }

        try {
            const user = await UsuarioModel.findByUsername(nombreUsuario);

            if (!user) {
                await LoginAttemptModel.create({
                    nombreUsuarioIntentado: nombreUsuario,
                    success: 0,
                    failure_reason: 'Usuario no existe',
                    ip_address,
                    user_agent
                });
                return res.status(401).json({ message: 'Credenciales inválidas.' });
            }

            if (user.estadoUsuario !== 'A') {
                return res.status(403).json({ message: 'El usuario se encuentra inactivo.' });
            }

            // 🔐 AHORA SE USA comparePassword (acepta hash y texto plano)
            const isMatch = await UsuarioModel.comparePassword(contrasena, user.contrasena);

            if (!isMatch) {
                await LoginAttemptModel.create({
                    idUsuario: user.idUsuario,
                    nombreUsuarioIntentado: nombreUsuario,
                    success: 0,
                    failure_reason: 'Contraseña incorrecta',
                    ip_address,
                    user_agent
                });
                return res.status(401).json({ message: 'Credenciales inválidas.' });
            }

            const { accessToken, refreshToken } =
                AuthController.generateTokens(user.idUsuario, user.nombreUsuario, user.idRol);
            
            await AuthTokenModel.create({
                idUsuario:  user.idUsuario,
                token_hash: refreshToken, 
                token_type: 'refresh',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 19)
                  .replace('T', ' '),
                ip_address,
                user_agent
            });

            await LoginAttemptModel.create({
                idUsuario: user.idUsuario,
                nombreUsuarioIntentado: nombreUsuario,
                success: 1,
                ip_address,
                user_agent
            });
            
            await BitacoraModel.create({
                idUsuario: user.idUsuario,
                accion: 'LOGIN',
                tabla: 'usuarios',
                pk_afectada: user.idUsuario.toString(),
                descripcion: `Inicio de sesión exitoso.`
            });

            return res.status(200).json({ 
                message: 'Inicio de sesión exitoso.', 
                accessToken, 
                refreshToken, 
                user: { 
                    idUsuario:      user.idUsuario, 
                    nombreUsuario:  user.nombreUsuario, 
                    idRol:          user.idRol 
                }
            });

        } catch (error) {
            console.error('Error durante el login:', error.message);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    static async logout(req, res) {
        const { refreshToken } = req.body;
        const ip_address = req.ip; 

        if (!refreshToken) {
            return res.status(400).json({ message: 'El token de refresco es obligatorio.' });
        }

        try {
            const tokenRecord = await AuthTokenModel.findValidByHash(refreshToken);

            if (!tokenRecord) {
                return res.status(401).json({ message: 'Token no válido o ya revocado.' });
            }

            await AuthTokenModel.revokeById(tokenRecord.id);

            await BitacoraModel.create({
                idUsuario: tokenRecord.idUsuario,
                accion: 'LOGOUT',
                tabla: 'authtokens',
                pk_afectada: tokenRecord.id.toString(),
                descripcion: `Cierre de sesión.`
            });

            return res.status(200).json({ message: 'Sesión cerrada con éxito.' });

        } catch (error) {
            console.error('Error durante el logout:', error.message);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
}

module.exports = AuthController;
