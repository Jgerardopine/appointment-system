// Validation Service
// Demonstrates: Single Responsibility - Only handles validation logic

class ValidationService {
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        // Remove all non-numeric characters
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Check if it's a valid phone length (10-15 digits)
        return cleanPhone.length >= 10 && cleanPhone.length <= 15;
    }

    validatePassword(password) {
        // At least 8 characters, one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }

    validateDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    validateUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }
        
        // Remove potentially dangerous characters
        return input
            .replace(/[<>]/g, '') // Remove HTML tags
            .trim(); // Remove leading/trailing whitespace
    }

    validateAge(birthDate, minAge = 0, maxAge = 150) {
        const today = new Date();
        const birth = new Date(birthDate);
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= minAge && age <= maxAge;
    }

    validateTelegramId(telegramId) {
        // Telegram IDs are numeric strings
        return /^\d+$/.test(telegramId);
    }

    validateMedicalHistory(medicalHistory) {
        // Ensure it's an object
        if (typeof medicalHistory !== 'object' || medicalHistory === null) {
            return false;
        }
        
        // Check for required fields if any
        // For now, just return true if it's an object
        return true;
    }

    validatePaginationParams(page, limit) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        return (
            !isNaN(pageNum) && 
            !isNaN(limitNum) && 
            pageNum > 0 && 
            limitNum > 0 && 
            limitNum <= 100
        );
    }
}

module.exports = { ValidationService };
