// Patient Service - Business Logic
// Demonstrates: Service Layer Pattern, Business Rules Encapsulation

class PatientService {
    constructor(patientRepository, eventPublisher, validationService) {
        this.patientRepository = patientRepository;
        this.eventPublisher = eventPublisher;
        this.validationService = validationService;
    }

    // Open/Closed Principle: Open for extension, closed for modification
    async createPatient(patientData) {
        // Validate business rules
        await this.validatePatientData(patientData);
        
        // Create patient
        const patient = await this.patientRepository.create(patientData);
        
        // Publish event
        await this.eventPublisher.publish('patient.created', {
            patient_id: patient.id,
            email: patient.email,
            name: patient.name,
            has_telegram: !!patient.telegram_id,
            created_at: patient.created_at
        });
        
        return patient;
    }

    async updatePatient(id, updates) {
        // Validate updates
        if (updates.email && !this.validationService.validateEmail(updates.email)) {
            throw new Error('Invalid email format');
        }
        
        if (updates.phone && !this.validationService.validatePhone(updates.phone)) {
            throw new Error('Invalid phone format');
        }
        
        // Update patient
        const patient = await this.patientRepository.update(id, updates);
        
        if (!patient) {
            return null;
        }
        
        // Publish event
        await this.eventPublisher.publish('patient.updated', {
            patient_id: patient.id,
            updates: Object.keys(updates),
            updated_at: patient.updated_at
        });
        
        return patient;
    }

    async deletePatient(id) {
        const deleted = await this.patientRepository.delete(id);
        
        if (deleted) {
            // Publish event
            await this.eventPublisher.publish('patient.deleted', {
                patient_id: id,
                deleted_at: new Date().toISOString()
            });
        }
        
        return deleted;
    }

    async linkTelegramAccount(patientId, telegramId, telegramUsername) {
        // Check if telegram ID is already linked to another patient
        const existing = await this.patientRepository.findByTelegramId(telegramId);
        if (existing && existing.id !== patientId) {
            throw new Error('This Telegram account is already linked to another patient');
        }
        
        // Update patient with Telegram info
        const patient = await this.patientRepository.updateTelegramInfo(
            patientId,
            telegramId,
            telegramUsername
        );
        
        if (!patient) {
            throw new Error('Patient not found');
        }
        
        // Publish event
        await this.eventPublisher.publish('patient.telegram_linked', {
            patient_id: patient.id,
            telegram_id: telegramId,
            telegram_username: telegramUsername,
            linked_at: new Date().toISOString()
        });
        
        return patient;
    }

    async validatePatientData(data) {
        // Business rule: Email is required
        if (!data.email) {
            throw new Error('Email is required');
        }
        
        // Business rule: Valid email format
        if (!this.validationService.validateEmail(data.email)) {
            throw new Error('Invalid email format');
        }
        
        // Business rule: Name is required
        if (!data.name || data.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        
        // Business rule: Age restrictions (if date of birth provided)
        if (data.date_of_birth) {
            const age = this.calculateAge(new Date(data.date_of_birth));
            if (age < 0) {
                throw new Error('Date of birth cannot be in the future');
            }
            if (age > 150) {
                throw new Error('Invalid date of birth');
            }
        }
        
        return true;
    }

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    async getPatientStatistics() {
        return await this.patientRepository.getStatistics();
    }

    async findOrCreateByTelegram(telegramId, telegramUsername, firstName) {
        // Try to find existing patient
        let patient = await this.patientRepository.findByTelegramId(telegramId);
        
        if (!patient) {
            // Create new patient with Telegram info
            patient = await this.createPatient({
                telegram_id: telegramId,
                telegram_username: telegramUsername,
                name: firstName || `Telegram User ${telegramId}`,
                email: `telegram_${telegramId}@auto.generated`,
                // Password not required for Telegram users
            });
        }
        
        return patient;
    }
}

module.exports = { PatientService };
