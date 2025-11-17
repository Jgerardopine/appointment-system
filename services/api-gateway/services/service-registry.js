class ServiceRegistry {
    constructor() {
        this.services = {
            'appointment-service': process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:8000',
            'patient-service': process.env.PATIENT_SERVICE_URL || 'http://patient-service:3002',
            'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003'
        };
    }

    getServices() {
        return this.services;
    }

    getEndpoints() {
        return [
            { name: 'appointments', path: '/api/appointments', target: this.services['appointment-service'] },
            { name: 'patients', path: '/api/patients', target: this.services['patient-service'] },
            { name: 'notifications', path: '/api/notifications', target: this.services['notification-service'] }
        ];
    }
}

// 👇 EXPORTA SOLO LA CLASE
module.exports = ServiceRegistry;
