// Notification Service - Main Application
// Demonstrates: Strategy Pattern for different notification channels

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import notification strategies
const { EmailNotificationStrategy } = require('./strategies/email.strategy');
const { SMSNotificationStrategy } = require('./strategies/sms.strategy');
const { TelegramNotificationStrategy } = require('./strategies/telegram.strategy');
const { WhatsAppNotificationStrategy } = require('./strategies/whatsapp.strategy');

// Import services
const { NotificationService } = require('./services/notification.service');
const { TemplateService } = require('./services/template.service');
const { NotificationRepository } = require('./repositories/notification.repository');

// Import infrastructure
const { Database } = require('./infrastructure/database');
const { EventConsumer } = require('./infrastructure/event-consumer');
const { ErrorHandler } = require('./middleware/error-handler');
const { Logger } = require('./utils/logger');

class NotificationServiceApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3003;
        this.logger = new Logger('NotificationService');
        
        // Initialize dependencies
        this.initializeDependencies();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupEventConsumers();
        this.setupErrorHandling();
    }

    // Dependency Injection and Strategy Pattern setup
    initializeDependencies() {
        // Infrastructure
        this.database = new Database(process.env.DATABASE_URL);
        
        // Repositories
        this.notificationRepository = new NotificationRepository(this.database);
        
        // Services
        this.templateService = new TemplateService();
        
        // Notification strategies (Strategy Pattern)
        this.notificationStrategies = {
            email: new EmailNotificationStrategy(),
            sms: new SMSNotificationStrategy(),
            telegram: new TelegramNotificationStrategy(process.env.TELEGRAM_BOT_TOKEN),
            whatsapp: new WhatsAppNotificationStrategy()
        };
        
        // Main notification service
        this.notificationService = new NotificationService(
            this.notificationStrategies,
            this.notificationRepository,
            this.templateService
        );
        
        // Event consumer
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
                timestamp: new Date().toISOString()
            });
        });

        // Send notification
        this.app.post('/notifications/send', this.sendNotification.bind(this));
        
        // Send bulk notifications
        this.app.post('/notifications/send-bulk', this.sendBulkNotifications.bind(this));
        
        // Get notification status
        this.app.get('/notifications/:id', this.getNotificationStatus.bind(this));
        
        // List notifications
        this.app.get('/notifications', this.listNotifications.bind(this));
        
        // Retry failed notification
        this.app.post('/notifications/:id/retry', this.retryNotification.bind(this));
        
        // Template management
        this.app.get('/templates', this.listTemplates.bind(this));
        this.app.get('/templates/:name', this.getTemplate.bind(this));
        this.app.post('/templates', this.createTemplate.bind(this));
        this.app.put('/templates/:name', this.updateTemplate.bind(this));
    }

    setupEventConsumers() {
        // Subscribe to appointment events
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

    // Route Handlers

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
                notification_id: notification.id,
                status: notification.status
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
                return res.status(404).json({
                    error: 'Template not found'
                });
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
                return res.status(404).json({
                    error: 'Template not found'
                });
            }
            
            res.json(template);
        } catch (error) {
            next(error);
        }
    }

    // Event Handlers

    async handleAppointmentCreated(event) {
        const { patient_id, appointment_date, appointment_time, doctor_id } = event.data;
        
        // Send confirmation notification
        await this.notificationService.send({
            channel: 'telegram', // Or determine from patient preferences
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
        
        // Send cancellation notification
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
        
        // Send reminder notification
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

    setupErrorHandling() {
        const errorHandler = new ErrorHandler();
        this.app.use(errorHandler.handle.bind(errorHandler));
    }

    async start() {
        try {
            // Connect to database
            await this.database.connect();
            this.logger.info('Database connected');
            
            // Start event consumer
            await this.eventConsumer.start();
            this.logger.info('Event consumer started');
            
            // Start server
            this.app.listen(this.port, () => {
                this.logger.info(`Notification Service running on port ${this.port}`);
            });
        } catch (error) {
            this.logger.error('Failed to start service:', error);
            process.exit(1);
        }
    }
}

// Start the service
const service = new NotificationServiceApp();
service.start();

module.exports = NotificationServiceApp;
