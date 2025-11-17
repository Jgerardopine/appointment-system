// Logger Utility - API Gateway

class Logger {
    constructor(service) {
        this.service = service;
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLevel = this.levels[process.env.LOG_LEVEL || 'INFO'];
    }

    error(message, ...args) {
        if (this.currentLevel >= this.levels.ERROR) {
            console.error(`[${this.timestamp()}] [ERROR] [${this.service}] ${message}`, ...args);
        }
    }

    warn(message, ...args) {
        if (this.currentLevel >= this.levels.WARN) {
            console.warn(`[${this.timestamp()}] [WARN] [${this.service}] ${message}`, ...args);
        }
    }

    info(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            console.info(`[${this.timestamp()}] [INFO] [${this.service}] ${message}`, ...args);
        }
    }

    debug(message, ...args) {
        if (this.currentLevel >= this.levels.DEBUG) {
            console.debug(`[${this.timestamp()}] [DEBUG] [${this.service}] ${message}`, ...args);
        }
    }

    timestamp() {
        return new Date().toISOString();
    }
}

module.exports = { Logger };
