// Notification Service - Main Application (CORRECTED & COMPLETE)
// Demonstrates: Strategy Pattern for different notification channels

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');

// -------------------------------------------------------------------------
// TELEGRAM STRATEGY - ÚNICO canal activo
// -------------------------------------------------------------------------
const { TelegramNotificationStrategy } = require('./strategies/telegram.strategy');
//const { WhatsAppNotificationStrategy } = require('./strategies/telegram.strategy');

// -------------------------------------------------------------------------
// UTILIDADES Y CLASES DE INFRAESTRUCTURA
// -------------------------------------------------------------------------

class Logger {
    constructor(name) {
        this.name = name;
    }
    
    info(...args) { 
        console.log(`[${this.name}][INFO]`, new Date().toISOString(), ...args); 
    }
    
    error(...args) { 
        console.error(`[${this.name}][ERROR]`, new Date().toISOString(), ...args); 
    }
    
    warn(...args) { 
        console.warn(`[${this.name}][WARN]`, new Date().toISOString(), ...args); 
    }
}

class Database {
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString: connectionString || process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        this.pool.on('error', (err) => {
            console.error('[Database] Unexpected error on idle client', err);
        });
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            console.log('[Database] Connected to PostgreSQL');
            client.release();
            return true;
        } catch (error) {
            console.error('[Database] Connection error:', error);
            throw error;
        }
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('[Database] Query executed', { duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('[Database] Query error:', error);
            throw error;
        }
    }

    async disconnect() {
        await this.pool.end();
        console.log('[Database] Disconnected from PostgreSQL');
    }
}

// -------------------------------------------------------------------------
// NOTIFICATION REPOSITORY - IMPLEMENTACIÓN REAL
// -------------------------------------------------------------------------

const { v4: uuidv4 } = require('uuid');

class NotificationRepository {
    constructor(database) {
        this.db = database;
    }

    async save(notificationData) {
        const id = uuidv4();
        const now = new Date();
        
        const query = `
            INSERT INTO notifications (
                id, appointment_id, patient_id, type, channel, status,
                recipient, subject, content, metadata, created_at, retry_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        
        const values = [
            id,
            notificationData.appointment_id || null,
            notificationData.patient_id || null,
            notificationData.type || 'general',
            notificationData.channel,
            notificationData.status || 'pending',
            notificationData.recipient,
            notificationData.subject || null,
            notificationData.content,
            JSON.stringify(notificationData.metadata || {}),
            now,
            0
        ];
        
        try {
            const result = await this.db.query(query, values);
            return this.mapRowToNotification(result.rows[0]);
        } catch (error) {
            console.error('[NotificationRepository] Error saving:', error);
            throw error;
        }
    }

    async findById(id) {
        const query = 'SELECT * FROM notifications WHERE id = $1';
        
        try {
            const result = await this.db.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return this.mapRowToNotification(result.rows[0]);
        } catch (error) {
            console.error('[NotificationRepository] Error finding by ID:', error);
            throw error;
        }
    }

    async list(filters = {}, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT * FROM notifications
            WHERE 1=1
        `;
        
        const values = [];
        let valueIndex = 1;
        
        if (filters.patient_id) {
            query += ` AND patient_id = $${valueIndex}`;
            values.push(filters.patient_id);
            valueIndex++;
        }
        
        if (filters.appointment_id) {
            query += ` AND appointment_id = $${valueIndex}`;
            values.push(filters.appointment_id);
            valueIndex++;
        }
        
        if (filters.channel) {
            query += ` AND channel = $${valueIndex}`;
            values.push(filters.channel);
            valueIndex++;
        }
        
        if (filters.status) {
            query += ` AND status = $${valueIndex}`;
            values.push(filters.status);
            valueIndex++;
        }
        
        if (filters.type) {
            query += ` AND type = $${valueIndex}`;
            values.push(filters.type);
            valueIndex++;
        }
        
        query += ` ORDER BY created_at DESC`;
        query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
        values.push(limit, offset);
        
        try {
            const result = await this.db.query(query, values);
            
            // Get total count
            let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE 1=1`;
            const countValues = [];
            let countIndex = 1;
            
            if (filters.patient_id) {
                countQuery += ` AND patient_id = $${countIndex}`;
                countValues.push(filters.patient_id);
                countIndex++;
            }
            
            if (filters.appointment_id) {
                countQuery += ` AND appointment_id = $${countIndex}`;
                countValues.push(filters.appointment_id);
                countIndex++;
            }
            
            if (filters.channel) {
                countQuery += ` AND channel = $${countIndex}`;
                countValues.push(filters.channel);
                countIndex++;
            }
            
            if (filters.status) {
                countQuery += ` AND status = $${countIndex}`;
                countValues.push(filters.status);
                countIndex++;
            }
            
            if (filters.type) {
                countQuery += ` AND type = $${countIndex}`;
                countValues.push(filters.type);
                countIndex++;
            }
            
            const countResult = await this.db.query(countQuery, countValues);
            const total = parseInt(countResult.rows[0].total);
            
            return {
                items: result.rows.map(row => this.mapRowToNotification(row)),
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('[NotificationRepository] Error listing:', error);
            throw error;
        }
    }

    async updateStatus(id, status, errorMessage = null) {
        const query = `
            UPDATE notifications 
            SET status = $1, 
                sent_at = $2,
                error_message = $3
            WHERE id = $4
            RETURNING *
        `;
        
        const sentAt = status === 'sent' ? new Date() : null;
        
        try {
            const result = await this.db.query(query, [status, sentAt, errorMessage, id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return this.mapRowToNotification(result.rows[0]);
        } catch (error) {
            console.error('[NotificationRepository] Error updating status:', error);
            throw error;
        }
    }

    async incrementRetryCount(id) {
        const query = `
            UPDATE notifications 
            SET retry_count = retry_count + 1
            WHERE id = $1
            RETURNING *
        `;
        
        try {
            const result = await this.db.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return this.mapRowToNotification(result.rows[0]);
        } catch (error) {
            console.error('[NotificationRepository] Error incrementing retry:', error);
            throw error;
        }
    }

    mapRowToNotification(row) {
        if (!row) return null;
        
        return {
            id: row.id,
            appointment_id: row.appointment_id,
            patient_id: row.patient_id,
            type: row.type,
            channel: row.channel,
            status: row.status,
            recipient: row.recipient,
            subject: row.subject,
            content: row.content,
            sent_at: row.sent_at,
            error_message: row.error_message,
            retry_count: row.retry_count,
            metadata: typeof row.metadata === 'string' 
                ? JSON.parse(row.metadata) 
                : row.metadata,
            created_at: row.created_at
        };
    }
}

// -------------------------------------------------------------------------
// TEMPLATE SERVICE
// -------------------------------------------------------------------------

class TemplateService {
    constructor() {
        this.templates = {
            'appointment_confirmation': {
                subject: 'Cita Confirmada',
                body: 'Su cita ha sido confirmada para el {{appointment_date}} a las {{appointment_time}} con {{doctor_name}}'
            },
            'appointment_reminder': {
                subject: 'Recordatorio de Cita',
                body: 'Recordatorio: Tiene una cita mañana {{appointment_date}} a las {{appointment_time}}'
            },
            'appointment_cancelled': {
                subject: 'Cita Cancelada',
                body: 'Su cita {{appointment_id}} ha sido cancelada. Razón: {{reason}}'
            }
        };
    }

    listTemplates() {
        return Object.keys(this.templates).map(name => ({
            name,
            ...this.templates[name]
        }));
    }

    getTemplate(name) {
        return this.templates[name] || null;
    }

    createTemplate(template) {
        this.templates[template.name] = {
            subject: template.subject,
            body: template.body,
            channels: template.channels
        };
        return template;
    }

    updateTemplate(name, updates) {
        if (!this.templates[name]) return null;
        this.templates[name] = { ...this.templates[name], ...updates };
        return this.templates[name];
    }

    render(templateName, data) {
        const template = this.getTemplate(templateName);
        if (!template) return null;

        let rendered = template.body;
        for (const [key, value] of Object.entries(data)) {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        return {
            subject: template.subject,
            body: rendered
        };
    }
}

// -------------------------------------------------------------------------
// NOTIFICATION SERVICE - LÓGICA DE NEGOCIO
// -------------------------------------------------------------------------

class NotificationService {
    constructor(strategies, repository, templateService) {
        this.strategies = strategies;
        this.repository = repository;
        this.templateService = templateService;
    }

    async send({ channel, recipient, template, data, priority, appointment_id, patient_id }) {
        const strategy = this.strategies[channel];

        if (!strategy) {
            throw new Error(`Channel not supported: ${channel}`);
        }

        // Render template if provided
        const rendered = template 
            ? this.templateService.render(template, data || {})
            : {
                subject: 'Notification',
                body: data?.message || 'General notification'
            };

        if (!rendered) {
            throw new Error(`Template not found: ${template}`);
        }

        // Save notification to database FIRST
        const notificationData = {
            appointment_id,
            patient_id,
            type: template || 'general',
            channel,
            status: 'pending',
            recipient,
            subject: rendered.subject,
            content: rendered.body,
            metadata: {
                priority: priority || 'normal',
                template: template,
                data: data || {}
            }
        };

        const savedNotification = await this.repository.save(notificationData);

        // Try to send via strategy
        try {
            const result = await strategy.send({
                recipient,
                message: rendered.body
            });

            // Update status to sent
            await this.repository.updateStatus(savedNotification.id, 'sent');

            return {
                ...result,
                id: savedNotification.id,
                status: 'sent'
            };
        } catch (error) {
            // Update status to failed
            await this.repository.updateStatus(
                savedNotification.id, 
                'failed', 
                error.message
            );

            throw error;
        }
    }

    async sendBulk(notifications) {
        const results = [];
        
        for (const notification of notifications) {
            try {
                const result = await this.send(notification);
                results.push({ 
                    status: 'sent', 
                    notification_id: result.id,
                    ...result 
                });
            } catch (error) {
                results.push({ 
                    status: 'failed', 
                    error: error.message,
                    recipient: notification.recipient
                });
            }
        }
        
        return results;
    }

    async retry(notificationId) {
        // Get notification from database
        const notification = await this.repository.findById(notificationId);
        
        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.status !== 'failed') {
            throw new Error('Only failed notifications can be retried');
        }

        // Increment retry count
        await this.repository.incrementRetryCount(notificationId);

        // Try to send again
        const strategy = this.strategies[notification.channel];
        
        if (!strategy) {
            throw new Error(`Channel not supported: ${notification.channel}`);
        }

        try {
            const result = await strategy.send({
                recipient: notification.recipient,
                message: notification.content
            });

            // Update status to sent
            await this.repository.updateStatus(notificationId, 'sent');

            return {
                ...result,
                id: notificationId,
                status: 'sent',
                retry_count: notification.retry_count + 1
            };
        } catch (error) {
            // Update status still failed
            await this.repository.updateStatus(
                notificationId, 
                'failed', 
                error.message
            );

            throw error;
        }
    }
}

// -------------------------------------------------------------------------
// EVENT CONSUMER (Stub - para mantener estructura)
// -------------------------------------------------------------------------

class EventConsumer {
    constructor(notificationService) {
        this.notificationService = notificationService;
        this.handlers = {};
    }

    async start() {
        console.log('[EVENT] Event consumer started (stub mode)');
    }

    subscribe(eventType, handler) {
        this.handlers[eventType] = handler;
        console.log(`[EVENT] Subscribed to: ${eventType}`);
    }
}

// -------------------------------------------------------------------------
// ERROR HANDLER
// -------------------------------------------------------------------------

class ErrorHandler {
    handle(err, req, res, next) {
        console.error('[ERROR]', err);
        
        const status = err.status || 500;
        const message = err.message || 'Internal server error';
        
        res.status(status).json({
            error: message,
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack 
            })
        });
    }
}

// -------------------------------------------------------------------------
// APLICACIÓN PRINCIPAL
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

    initializeDependencies() {
        // Infrastructure
        this.database = new Database(process.env.DATABASE_URL);

        // Repositories
        this.notificationRepository = new NotificationRepository(this.database);
        
        // Services
        this.templateService = new TemplateService();

        // Notification Strategies (solo Telegram activo)
        this.notificationStrategies = {
            telegram: new TelegramNotificationStrategy(process.env.TELEGRAM_BOT_TOKEN)
        };

        // Notification Service
        this.notificationService = new NotificationService(
            this.notificationStrategies,
            this.notificationRepository,
            this.templateService
        );

        // Event Consumer
        this.eventConsumer = new EventConsumer(this.notificationService);
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'notification-service',
                timestamp: new Date().toISOString(),
                database: this.database.pool.totalCount > 0 ? 'connected' : 'disconnected'
            });
        });

        // Notification endpoints
        this.app.post('/notifications/send', this.sendNotification.bind(this));
        this.app.post('/notifications/send-bulk', this.sendBulkNotifications.bind(this));
        this.app.get('/notifications/:id', this.getNotificationStatus.bind(this));
        this.app.get('/notifications', this.listNotifications.bind(this));
        this.app.post('/notifications/:id/retry', this.retryNotification.bind(this));

        // Template endpoints
        this.app.get('/templates', this.listTemplates.bind(this));
        this.app.get('/templates/:name', this.getTemplate.bind(this));
        this.app.post('/templates', this.createTemplate.bind(this));
        this.app.put('/templates/:name', this.updateTemplate.bind(this));
    }

    setupEventConsumers() {
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

    // -------------------------------------------------------------------------
    // ROUTE HANDLERS
    // -------------------------------------------------------------------------

    async sendNotification(req, res, next) {
        try {
            const { 
                channel, 
                recipient, 
                template, 
                data, 
                priority,
                appointment_id,
                patient_id
            } = req.body;

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
                priority: priority || 'normal',
                appointment_id,
                patient_id
            });

            res.status(201).json({
                success: true,
                notification
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

            const result = await this.notificationService.retry(id);

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

    // -------------------------------------------------------------------------
    // EVENT HANDLERS
    // -------------------------------------------------------------------------

    async handleAppointmentCreated(event) {
        const { 
            patient_id, 
            appointment_date, 
            appointment_time, 
            doctor_name,
            appointment_id 
        } = event.data;

        try {
            await this.notificationService.send({
                channel: 'telegram',
                recipient: patient_id,
                template: 'appointment_confirmation',
                data: {
                    appointment_date,
                    appointment_time,
                    doctor_name
                },
                appointment_id,
                patient_id,
                priority: 'high'
            });
        } catch (error) {
            this.logger.error('Error handling appointment.created event:', error);
        }
    }

    async handleAppointmentCancelled(event) {
        const { 
            patient_id, 
            appointment_id, 
            reason 
        } = event.data;

        try {
            await this.notificationService.send({
                channel: 'telegram',
                recipient: patient_id,
                template: 'appointment_cancelled',
                data: {
                    appointment_id,
                    reason
                },
                appointment_id,
                patient_id,
                priority: 'high'
            });
        } catch (error) {
            this.logger.error('Error handling appointment.cancelled event:', error);
        }
    }

    async handleAppointmentReminder(event) {
        const { 
            patient_id, 
            appointment_id, 
            appointment_date, 
            appointment_time 
        } = event.data;

        try {
            await this.notificationService.send({
                channel: 'telegram',
                recipient: patient_id,
                template: 'appointment_reminder',
                data: {
                    appointment_id,
                    appointment_date,
                    appointment_time
                },
                appointment_id,
                patient_id,
                priority: 'high'
            });
        } catch (error) {
            this.logger.error('Error handling appointment.reminder event:', error);
        }
    }

    setupErrorHandling() {
        const errorHandler = new ErrorHandler();
        this.app.use(errorHandler.handle.bind(errorHandler));
    }

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
// START SERVICE
// -------------------------------------------------------------------------

const service = new NotificationServiceApp();
service.start();

module.exports = NotificationServiceApp;
