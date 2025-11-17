// Patient Repository
// Demonstrates: Repository Pattern, Data Access Layer

const { v4: uuidv4 } = require('uuid');

class PatientRepository {
    constructor(database) {
        this.db = database;
    }

    // Single Responsibility: Only handles data persistence
    
    async create(patientData) {
        const id = uuidv4();
        const now = new Date();
        
        const query = `
            INSERT INTO patients (
                id, name, email, phone, telegram_id, telegram_username,
                date_of_birth, address, medical_history, password,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        
        const values = [
            id,
            patientData.name,
            patientData.email,
            patientData.phone || null,
            patientData.telegram_id || null,
            patientData.telegram_username || null,
            patientData.date_of_birth || null,
            patientData.address || null,
            JSON.stringify(patientData.medical_history || {}),
            patientData.password || null,
            now,
            now
        ];
        
        try {
            const result = await this.db.query(query, values);
            return this.mapRowToPatient(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Email or Telegram ID already exists');
            }
            throw error;
        }
    }

    async findById(id) {
        const query = 'SELECT * FROM patients WHERE id = $1';
        const result = await this.db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.mapRowToPatient(result.rows[0]);
    }

    async findByEmail(email) {
        const query = 'SELECT * FROM patients WHERE email = $1';
        const result = await this.db.query(query, [email]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.mapRowToPatient(result.rows[0]);
    }

    async findByTelegramId(telegramId) {
        const query = 'SELECT * FROM patients WHERE telegram_id = $1';
        const result = await this.db.query(query, [telegramId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.mapRowToPatient(result.rows[0]);
    }

    async update(id, updates) {
        const allowedFields = [
            'name', 'phone', 'address', 'date_of_birth',
            'medical_history', 'telegram_id', 'telegram_username'
        ];
        
        const updateFields = [];
        const values = [];
        let valueIndex = 1;
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateFields.push(`${field} = $${valueIndex}`);
                
                if (field === 'medical_history') {
                    values.push(JSON.stringify(updates[field]));
                } else {
                    values.push(updates[field]);
                }
                valueIndex++;
            }
        }
        
        if (updateFields.length === 0) {
            return this.findById(id);
        }
        
        updateFields.push(`updated_at = $${valueIndex}`);
        values.push(new Date());
        valueIndex++;
        
        values.push(id);
        
        const query = `
            UPDATE patients 
            SET ${updateFields.join(', ')}
            WHERE id = $${valueIndex}
            RETURNING *
        `;
        
        const result = await this.db.query(query, values);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.mapRowToPatient(result.rows[0]);
    }

    async delete(id) {
        // Soft delete - just mark as inactive
        const query = `
            UPDATE patients 
            SET deleted_at = $1, updated_at = $1
            WHERE id = $2 AND deleted_at IS NULL
            RETURNING id
        `;
        
        const result = await this.db.query(query, [new Date(), id]);
        return result.rows.length > 0;
    }

    async list(options = {}) {
        const { page = 1, limit = 20, search = '' } = options;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT * FROM patients 
            WHERE deleted_at IS NULL
        `;
        
        const values = [];
        let valueIndex = 1;
        
        if (search) {
            query += ` AND (
                name ILIKE $${valueIndex} OR 
                email ILIKE $${valueIndex} OR 
                phone ILIKE $${valueIndex}
            )`;
            values.push(`%${search}%`);
            valueIndex++;
        }
        
        query += ` ORDER BY created_at DESC`;
        query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
        values.push(limit, offset);
        
        const result = await this.db.query(query, values);
        
        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM patients 
            WHERE deleted_at IS NULL
        `;
        
        if (search) {
            countQuery += ` AND (
                name ILIKE $1 OR 
                email ILIKE $1 OR 
                phone ILIKE $1
            )`;
        }
        
        const countResult = await this.db.query(
            countQuery, 
            search ? [`%${search}%`] : []
        );
        
        return {
            items: result.rows.map(row => this.mapRowToPatient(row)),
            total: parseInt(countResult.rows[0].total),
            page,
            limit,
            totalPages: Math.ceil(countResult.rows[0].total / limit)
        };
    }

    async updateTelegramInfo(patientId, telegramId, telegramUsername) {
        const query = `
            UPDATE patients 
            SET telegram_id = $1, telegram_username = $2, updated_at = $3
            WHERE id = $4
            RETURNING *
        `;
        
        const result = await this.db.query(query, [
            telegramId,
            telegramUsername,
            new Date(),
            patientId
        ]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.mapRowToPatient(result.rows[0]);
    }

    async getStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_patients,
                COUNT(telegram_id) as telegram_linked,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_last_month,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_last_week
            FROM patients 
            WHERE deleted_at IS NULL
        `;
        
        const result = await this.db.query(query);
        return result.rows[0];
    }

    // Helper method to map database row to patient object
    mapRowToPatient(row) {
        if (!row) return null;
        
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            telegram_id: row.telegram_id,
            telegram_username: row.telegram_username,
            date_of_birth: row.date_of_birth,
            address: row.address,
            medical_history: typeof row.medical_history === 'string' 
                ? JSON.parse(row.medical_history) 
                : row.medical_history,
            password: row.password, // Be careful with this
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at
        };
    }
}

module.exports = { PatientRepository };
