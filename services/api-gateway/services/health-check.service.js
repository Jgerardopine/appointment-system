// Health Check Service for API Gateway

class HealthCheckService {
    constructor(serviceRegistry) {
        this.serviceRegistry = serviceRegistry;
    }

    async checkAll() {
        // Versión muy simple: solo reporta que el gateway está vivo
        // y devuelve la lista de servicios registrados.
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: this.serviceRegistry.getServices()
        };
    }
}

module.exports = { HealthCheckService };
