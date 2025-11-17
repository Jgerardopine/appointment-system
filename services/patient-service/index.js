// Patient Service - Main Application
// Demonstrates: SOLID principles in Node.js, Clean Architecture

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import custom modules
const { PatientRepository } = require('./repositories/patient.repository');
const { PatientService } = require('./services/patient.service');
const { AuthService } = require('./services/auth.service');
const { ValidationService } = require('./services/validation.service');
const { Database } = require('./infrastructure/database');
const { EventPublisher } = require('./infrastructure/event-publisher');
const { ErrorHandler } = require('./middleware/error-handler');
const { Logger } = require('./utils/logger');

class PatientServiceApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.logger = new Logger('PatientService');
        
        // Initialize dependencies (Dependency Injection)
        this.initializeDependencies();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    // Dependency Injection Container
    initializeDependencies() {
        // Infrastructure
        this.database = new Database(process.env.DATABASE_URL);
        this.eventPublisher = new EventPublisher();
        
        // Repositories
        this.patientRepository = new PatientRepository(this.database);
        
        // Services
        this.validationService = new ValidationService();
        this.authService = new AuthService(process.env.JWT_SECRET);
        this.patientService = new PatientService(
            this.patientRepository,
            this.eventPublisher,
            this.validationService
        );
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
                service: 'patient-service',
                timestamp: new Date().toISOString()
            });
        });

        // Authentication endpoints
        this.app.post('/auth/register', this.register.bind(this));
        this.app.post('/auth/login', this.login.bind(this));
        
        // Patient CRUD endpoints
        this.app.get('/patients/:id', this.getPatient.bind(this));
        this.app.put('/patients/:id', this.updatePatient.bind(this));
        this.app.delete('/patients/:id', this.deletePatient.bind(this));
        this.app.get('/patients', this.listPatients.bind(this));
        
        // Telegram integration
        this.app.post('/patients/telegram/link', this.linkTelegram.bind(this));
        this.app.get('/patients/telegram/:telegramId', this.getByTelegramId.bind(this));
    }

    // Route Handlers

    async register(req, res, next) {
        try {
            const { email, password, name, phone, date_of_birth } = req.body;
            
            // Validate input
            if (!this.validationService.validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            
            if (!this.validationService.validatePassword(password)) {
                return res.status(400).json({ 
                    error: 'Password must be at least 8 characters with numbers and letters' 
                });
            }
            
            // Check if email exists
            const existing = await this.patientRepository.findByEmail(email);
            if (existing) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create patient
            const patient = await this.patientService.createPatient({
                email,
                password: hashedPassword,
                name,
                phone,
                date_of_birth
            });
            
            // Generate JWT token
            const token = this.authService.generateToken({
                id: patient.id,
                email: patient.email,
                type: 'patient'
            });
            
            // Publish event
            await this.eventPublisher.publish('patient.registered', {
                patient_id: patient.id,
                email: patient.email,
                registered_at: new Date().toISOString()
            });
            
            res.status(201).json({
                patient: {
                    id: patient.id,
                    email: patient.email,
                    name: patient.name
                },
                token
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            
            // Find patient
            const patient = await this.patientRepository.findByEmail(email);
            if (!patient) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Verify password
            const validPassword = await bcrypt.compare(password, patient.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Generate token
            const token = this.authService.generateToken({
                id: patient.id,
                email: patient.email,
                type: 'patient'
            });
            
            res.json({
                patient: {
                    id: patient.id,
                    email: patient.email,
                    name: patient.name
                },
                token
            });
        } catch (error) {
            next(error);
        }
    }

    async getPatient(req, res, next) {
        try {
            const { id } = req.params;
            
            const patient = await this.patientRepository.findById(id);
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            // Remove sensitive data
            delete patient.password;
            
            res.json(patient);
        } catch (error) {
            next(error);
        }
    }

    async updatePatient(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            // Remove fields that shouldn't be updated directly
            delete updates.id;
            delete updates.password;
            delete updates.email;
            
            const patient = await this.patientService.updatePatient(id, updates);
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            res.json(patient);
        } catch (error) {
            next(error);
        }
    }

    async deletePatient(req, res, next) {
        try {
            const { id } = req.params;
            
            const deleted = await this.patientService.deletePatient(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async listPatients(req, res, next) {
        try {
            const { page = 1, limit = 20, search } = req.query;
            
            const patients = await this.patientRepository.list({
                page: parseInt(page),
                limit: parseInt(limit),
                search
            });
            
            // Remove passwords from results
            patients.items = patients.items.map(p => {
                delete p.password;
                return p;
            });
            
            res.json(patients);
        } catch (error) {
            next(error);
        }
    }

    async linkTelegram(req, res, next) {
        try {
            const { patient_id, telegram_id, telegram_username } = req.body;
            
            // Verify patient exists
            const patient = await this.patientRepository.findById(patient_id);
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            // Update telegram info
            const updated = await this.patientService.linkTelegramAccount(
                patient_id,
                telegram_id,
                telegram_username
            );
            
            res.json({
                success: true,
                patient: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async getByTelegramId(req, res, next) {
        try {
            const { telegramId } = req.params;
            
            const patient = await this.patientRepository.findByTelegramId(telegramId);
            if (!patient) {
                // Auto-register if not found
                const newPatient = await this.patientService.createPatient({
                    telegram_id: telegramId,
                    name: `Telegram User ${telegramId}`,
                    email: `telegram_${telegramId}@temp.com`
                });
                
                return res.status(201).json(newPatient);
            }
            
            delete patient.password;
            res.json(patient);
        } catch (error) {
            next(error);
        }
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
            
            // Start server
            this.app.listen(this.port, () => {
                this.logger.info(`Patient Service running on port ${this.port}`);
            });
        } catch (error) {
            this.logger.error('Failed to start service:', error);
            process.exit(1);
        }
    }
}

// Start the service
const service = new PatientServiceApp();
service.start();

module.exports = PatientServiceApp;
