// API Gateway Service
// Demonstrates: API Gateway Pattern, Dependency Injection, Single Responsibility Principle

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Import custom modules (SOLID principles applied)
const { AuthMiddleware } = require('./middleware/auth.middleware');
const { RateLimiter } = require('./middleware/rate-limiter');
const { ErrorHandler } = require('./middleware/error-handler');
//const { ServiceRegistry } = require('./services/service-registry');
const ServiceRegistry = require('./services/service-registry');
const { HealthCheckService } = require('./services/health-check.service');
const { Logger } = require('./utils/logger');

class APIGateway {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.logger = new Logger('APIGateway');
        this.serviceRegistry = new ServiceRegistry();
        this.healthCheck = new HealthCheckService(this.serviceRegistry);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    // Single Responsibility: Middleware setup
    setupMiddleware() {
        // Security headers
        this.app.use(helmet());
        
        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            credentials: true
        }));
        
        // Request logging
        this.app.use(morgan('combined'));
        
        // Body parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Rate limiting (Open/Closed Principle - can extend without modifying)
        const rateLimiter = new RateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 100
        });
        this.app.use(rateLimiter.middleware());
    }

    // Single Responsibility: Route setup
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', async (req, res) => {
            const health = await this.healthCheck.checkAll();
            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        });

        // API Documentation
        this.app.get('/api/docs', (req, res) => {
            res.json({
                version: '1.0.0',
                endpoints: this.serviceRegistry.getEndpoints()
            });
        });

        // Service proxies with authentication
        this.setupServiceProxies();
    }

    // Dependency Inversion: Depend on abstractions
    setupServiceProxies() {
        const authMiddleware = new AuthMiddleware();

        // Appointment Service Proxy
        this.app.use('/api/appointments',
            authMiddleware.authenticate(),
            createProxyMiddleware({
                target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3001',
                changeOrigin: true,
                pathRewrite: { '^/api/appointments': '/appointments' },
                onError: this.handleProxyError.bind(this)
            })
        );

        // Patient Service Proxy
        this.app.use('/api/patients',
            authMiddleware.authenticate(),
            createProxyMiddleware({
                target: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3002',
                changeOrigin: true,
                pathRewrite: { '^/api/patients': '/patients' },
                onError: this.handleProxyError.bind(this)
            })
        );

        // Notification Service Proxy
        this.app.use('/api/notifications',
            authMiddleware.authenticate(),
            createProxyMiddleware({
                target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003',
                changeOrigin: true,
                pathRewrite: { '^/api/notifications': '/notifications' },
                onError: this.handleProxyError.bind(this)
            })
        );

        // Public endpoints (no auth required)
        this.app.post('/api/auth/register', this.proxyToPatientService.bind(this));
        this.app.post('/api/auth/login', this.proxyToPatientService.bind(this));
    }

    // Error handling for proxy failures
    handleProxyError(err, req, res) {
        this.logger.error(`Proxy error: ${err.message}`);
        res.status(503).json({
            error: 'Service temporarily unavailable',
            message: 'The requested service is not responding'
        });
    }

    // Proxy to patient service for auth
    async proxyToPatientService(req, res, next) {
        try {
            const response = await fetch(
                `${process.env.PATIENT_SERVICE_URL}${req.path}`,
                {
                    method: req.method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(req.body)
                }
            );
            const data = await response.json();
            res.status(response.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    // Single Responsibility: Error handling setup
    setupErrorHandling() {
        const errorHandler = new ErrorHandler();
        this.app.use(errorHandler.handle.bind(errorHandler));
    }

    // Start the gateway
    start() {
        this.app.listen(this.port, () => {
            this.logger.info(`API Gateway running on port ${this.port}`);
            this.logger.info('Services registered:', this.serviceRegistry.getServices());
        });
    }
}

// Initialize and start the gateway
const gateway = new APIGateway();
gateway.start();

module.exports = APIGateway;
