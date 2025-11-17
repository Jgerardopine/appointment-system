// Simple Rate Limiter stub
// Solo respeta la interfaz que usa index.js: new RateLimiter(opts).middleware()

class RateLimiter {
    constructor(options) {
        this.options = options;
    }

    middleware() {
        return (req, res, next) => {
            // Aquí podrías implementar un rate limit real (Redis, memoria, etc.)
            // Por ahora no bloqueamos nada
            next();
        };
    }
}

module.exports = { RateLimiter };
