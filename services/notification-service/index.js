// Notification Service - Main Application
// Demonstrates: Strategy Pattern for different notification channels

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// -------------------------------------------------------------------------
// IMPORTS – Dejamos SOLO Telegram activo. Todo lo demás desactivado.
// -------------------------------------------------------------------------

// ❌ Canales NO implementados aún — LOS COMENTAMOS
// const { EmailNotificationStrategy } = require('./strategies/email.strategy');
// const { SMSNotificationStrategy } = require('./strategies/sms.strategy');
// const { WhatsAppNotificationStrategy } = require('./strategies/whatsapp.strategy');

// ✅ ÚNICO canal activo
const { TelegramNotificationStrategy } = require('./strategies/telegram.strategy');

// -------------------------------------------------------------------------
// SERVICES – Comentamos los que NO existen todavía
// -------------------------------------------------------------------------

// ❌ NO existen todavía en tu carpeta
// const { NotificationService } = require('./services/notification.service');
// const { TemplateService } = require('./services/template.service');
// const { NotificationRepository } = require('./repositories/notification.repository');

// ❌ Infraestructura faltante
// const { Database } = require('./infrastructure/database');
// const { EventConsumer } = require('./infrastructure/event-consumer');
// const { ErrorHandler } = require('./middleware/error-handler');
// const { Logger } = require('./utils/logger');

// -------------------------------------------------------------------------
// Para que NO TRUENE el servicio, creamos IMPLEMENTACIONES de respaldo (stubs)
// -------------------------------------------------------------------------

class Logger {
    info(...args) { console.log('[INFO]', ...args); }
    error(...args) { console.log('[ERROR]', ...args); }
    warn(...args) { console.log('[WARN]', ...args); }
}

class Database {
    constructor(url) { this.url = url; }
    async connect() {
        console.log('[DB] Fake database connected');
        return true;
    }
}

class NotificationRepository {
    constructor() {}
    async findById(id) { return null; }
    async list() { return []; }
    async save(notification) { return notification; }
}

class TemplateService {
    listTemplates() { return []; }
    getTemplate(name) { return null; }
    createTemplate(t) { return t; }
    updateTemplate() { return null; }
}

class NotificationService {
    constructor(strategies) {
        this.strategies = strategies;
    }

    async send({ channel, recipient, template, data }) {
        const strategy = this.strategies[channel];

        if (!strategy) {
            throw new Error(`Channel not supported: ${channel}`);
        }

        // Envía un mensaje muy simple
        return await strategy.send({
            recipient,
            message: `Template: ${template || 'default'}`
        });
    }

    async sendBulk(list) {
        const results = [];
        for (const item of list) {
            try {
                const res = await this.send(item);
                results.push({ status: 'sent', ...res });
            } catch (err) {
                results.push({ status: 'failed', error: err.message });
            }
        }
        return results;
    }

    async retry(notification) {
        return notification;
    }
}

class EventConsumer {
    constructor() {}
    async start() { console.log('[EVENT] Fake event consumer running'); }
    subscribe() {}
}

class ErrorHandler {
    handle(err, req, res, next) {
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
    }
}
// -------------------------------------------------------------------------
// Aplicación principal del servicio
// -------------------------------------------------------------------------

class NotificationServiceApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3003;
        this.logger = new Logger('NotificationService');

        // Inicializar todo
        this.initializeDependencies();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupEventConsumers();
        this.setupErrorHandling();
    }

    // ---------------------------------------------------------------------
    // Inicialización de dependencias (Strategy + DI)
    // ---------------------------------------------------------------------
    initializeDependencies() {
        this.database = new Database(process.env.DATABASE_URL);

        this.notificationRepository = new NotificationRepository();
        this.templateService = new TemplateService();

        // -----------------------------------------------------------------
        // SOLO Telegram activo
        // -----------------------------------------------------------------
        this.notificationStrategies = {
            telegram: new TelegramNotificationStrategy(process.env.TELEGRAM_BOT_TOKEN)
        };

        // Servicio principal de notificaciones
        this.notificationService = new NotificationService(
            this.notificationStrategies,
            this.notificationRepository,
            this.templateService
        );

        // Consumidor de eventos (fake)
        this.eventConsumer = new EventConsumer(this.notificationService);
    }

    // ---------------------------------------------------------------------
    // Middleware global
    // ---------------------------------------------------------------------
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    // ---------------------------------------------------------------------
    // Rutas principales del servicio
    // ---------------------------------------------------------------------
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'notification-service',
                timestamp: new Date().toISOString()
            });
        });

        // Enviar una notificación
        this.app.post('/notifications/send', this.sendNotification.bind(this));

        // Enviar múltiples notificaciones
        this.app.post('/notifications/send-bulk', this.sendBulkNotifications.bind(this));

        // Obtener una notificación por ID
        this.app.get('/notifications/:id', this.getNotificationStatus.bind(this));

        // Listar notificaciones
        this.app.get('/notifications', this.listNotifications.bind(this));

        // Reintentar notificación fallida
        this.app.post('/notifications/:id/retry', this.retryNotification.bind(this));

        // Manejo de templates
        this.app.get('/templates', this.listTemplates.bind(this));
        this.app.get('/templates/:name', this.getTemplate.bind(this));
        this.app.post('/templates', this.createTemplate.bind(this));
        this.app.put('/templates/:name', this.updateTemplate.bind(this));
    }

    // ---------------------------------------------------------------------
    // Configuración de consumidores de eventos (fake)
    // ---------------------------------------------------------------------
    setupEventConsumers() {
        // Mantenemos suscripciones para mantener estructura original
        this.eventConsumer.subscribe('appointment.created', async (event) => {
            await this.handleAppointmentCreated(event);
        });

        this.eventConsumer.subscribe('appointment.cancelled', async (event) => {
            await this.handleAppointmentCancelled(event);
        });

        this.eventConsumer.subscribe('appointment.reminder', async (event) => {
            await this.handleAppointmentReminder(event);
        });
    }

    // ---------------------------------------------------------------------
    // Handlers — envío de notificaciones
    // ---------------------------------------------------------------------
    async sendNotification(req, res, next) {
        try {
            const { channel, recipient, template, data, priority } = req.body;

            if (!channel || !recipient) {
                return res.status(400).json({
                    error: 'Channel and recipient are required'
                });
            }

            const notification = await this.notificationService.send({
                channel,
                recipient,
                template,
                data,
                priority: priority || 'normal'
            });

            res.status(201).json({
                success: true,
                status: notification.status || 'sent',
                detail: notification
            });

        } catch (error) {
            next(error);
        }
    }

        async sendBulkNotifications(req, res, next) {
        try {
            const { notifications } = req.body;

            if (!notifications || !Array.isArray(notifications)) {
                return res.status(400).json({
                    error: 'Notifications array is required'
                });
            }

            const results = await this.notificationService.sendBulk(notifications);

            res.json({
                success: true,
                total: results.length,
                successful: results.filter(r => r.status === 'sent').length,
                failed: results.filter(r => r.status === 'failed').length,
                results
            });

        } catch (error) {
            next(error);
        }
    }

    async getNotificationStatus(req, res, next) {
        try {
            const { id } = req.params;

            const notification = await this.notificationRepository.findById(id);

            if (!notification) {
                return res.status(404).json({
                    error: 'Notification not found'
                });
            }

            res.json(notification);

        } catch (error) {
            next(error);
        }
    }

    async listNotifications(req, res, next) {
        try {
            const {
                patient_id,
                appointment_id,
                channel,
                status,
                page = 1,
                limit = 20
            } = req.query;

            const filters = {
                patient_id,
                appointment_id,
                channel,
                status
            };

            const notifications = await this.notificationRepository.list(
                filters,
                parseInt(page),
                parseInt(limit)
            );

            res.json(notifications);

        } catch (error) {
            next(error);
        }
    }

    async retryNotification(req, res, next) {
        try {
            const { id } = req.params;

            const notification = await this.notificationRepository.findById(id);

            if (!notification) {
                return res.status(404).json({
                    error: 'Notification not found'
                });
            }

            if (notification.status !== 'failed') {
                return res.status(400).json({
                    error: 'Only failed notifications can be retried'
                });
            }

            const result = await this.notificationService.retry(notification);

            res.json({
                success: true,
                notification: result
            });

        } catch (error) {
            next(error);
        }
    }

    async listTemplates(req, res, next) {
        try {
            const templates = this.templateService.listTemplates();
            res.json(templates);

        } catch (error) {
            next(error);
        }
    }

    async getTemplate(req, res, next) {
        try {
            const { name } = req.params;
            const template = this.templateService.getTemplate(name);

            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            res.json(template);

        } catch (error) {
            next(error);
        }
    }

    async createTemplate(req, res, next) {
        try {
            const { name, subject, body, channels } = req.body;

            const template = this.templateService.createTemplate({
                name,
                subject,
                body,
                channels
            });

            res.status(201).json(template);

        } catch (error) {
            next(error);
        }
    }

    async updateTemplate(req, res, next) {
        try {
            const { name } = req.params;
            const updates = req.body;

            const template = this.templateService.updateTemplate(name, updates);

            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            res.json(template);

        } catch (error) {
            next(error);
        }
    }
    // ---------------------------------------------------------------------
    // Event handlers
    // ---------------------------------------------------------------------
    async handleAppointmentCreated(event) {
        const { patient_id, appointment_date, appointment_time, doctor_id } = event.data;

        await this.notificationService.send({
            channel: 'telegram',
            recipient: patient_id,
            template: 'appointment_confirmation',
            data: {
                appointment_date,
                appointment_time,
                doctor_id
            },
            metadata: {
                appointment_id: event.data.id,
                event_id: event.id
            }
        });
    }

    async handleAppointmentCancelled(event) {
        const { patient_id, appointment_id, reason } = event.data;

        await this.notificationService.send({
            channel: 'telegram',
            recipient: patient_id,
            template: 'appointment_cancelled',
            data: {
                appointment_id,
                reason
            },
            metadata: {
                appointment_id,
                event_id: event.id
            }
        });
    }

    async handleAppointmentReminder(event) {
        const { patient_id, appointment_id, appointment_date, appointment_time } = event.data;

        await this.notificationService.send({
            channel: 'telegram',
            recipient: patient_id,
            template: 'appointment_reminder',
            data: {
                appointment_id,
                appointment_date,
                appointment_time
            },
            priority: 'high',
            metadata: {
                appointment_id,
                event_id: event.id,
                reminder_type: '24_hours'
            }
        });
    }

    // ---------------------------------------------------------------------
    // Error handling
    // ---------------------------------------------------------------------
    setupErrorHandling() {
        const errorHandler = new ErrorHandler();
        this.app.use(errorHandler.handle.bind(errorHandler));
    }

    // ---------------------------------------------------------------------
    // Start service
    // ---------------------------------------------------------------------
    async start() {
        try {
            await this.database.connect();
            this.logger.info('Database connected');

            await this.eventConsumer.start();
            this.logger.info('Event consumer started');

            this.app.listen(this.port, () => {
                this.logger.info(`Notification Service running on port ${this.port}`);
            });

        } catch (error) {
            this.logger.error('Failed to start service:', error);
            process.exit(1);
        }
    }
}

// -------------------------------------------------------------------------
// Run service
// -------------------------------------------------------------------------
const service = new NotificationServiceApp();
service.start();

module.exports = NotificationServiceApp;
