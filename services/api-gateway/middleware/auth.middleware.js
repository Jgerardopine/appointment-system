// Simple Auth Middleware stub
// Luego aquí puedes validar JWT si quieres, por ahora solo deja pasar

class AuthMiddleware {
    authenticate() {
        return (req, res, next) => {
            // Aquí podrías leer req.headers.authorization y validar el token
            // Por ahora lo dejamos como "permitir todo" para que el sistema funcione
            next();
        };
    }
}

module.exports = { AuthMiddleware };
