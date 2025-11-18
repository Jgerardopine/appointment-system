// Notification Repository - REAL IMPLEMENTATION
// Reemplaza el stub en notification-service/index.js

const { v4: uuidv4 } = require('uuid');

/**
 * Real Notification Repository with PostgreSQL
 * Demonstrates: Repository Pattern, Data Access Layer
 */
class NotificationRepository {
    constructor(database) {
        this.db = database;
    }

    /**
     * Save a new notification to database
     */
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

    /**
     * Find notification by ID
     */
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

    /**
     * List notifications with filters
     */
    async list(filters = {}, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT * FROM notifications
            WHERE 1=1
        `;
        
        const values = [];
        let valueIndex = 1;
        
        // Apply filters
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
        
        // Order by most recent first
        query += ` ORDER BY created_at DESC`;
        
        // Pagination
        query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
        values.push(limit, offset);
        
        try {
            const result = await this.db.query(query, values);
            
            // Get total count
            let countQuery = `
                SELECT COUNT(*) as total FROM notifications WHERE 1=1
            `;
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

    /**
     * Update notification status
     */
    async updateStatus(id, status, errorMessage = null) {
        const query = `
            UPDATE notifications 
            SET status = $1, 
                sent_at = $2,
                error_message = $3,
                updated_at = CURRENT_TIMESTAMP
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

    /**
     * Increment retry count
     */
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

    /**
     * Get failed notifications for retry
     */
    async getFailedNotifications(maxRetries = 3) {
        const query = `
            SELECT * FROM notifications
            WHERE status = 'failed'
                AND retry_count < $1
                AND created_at > NOW() - INTERVAL '24 hours'
            ORDER BY created_at ASC
            LIMIT 50
        `;
        
        try {
            const result = await this.db.query(query, [maxRetries]);
            return result.rows.map(row => this.mapRowToNotification(row));
        } catch (error) {
            console.error('[NotificationRepository] Error getting failed notifications:', error);
            throw error;
        }
    }

    /**
     * Get statistics
     */
    async getStatistics(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
                COUNT(CASE WHEN channel = 'telegram' THEN 1 END) as telegram_count,
                COUNT(CASE WHEN channel = 'email' THEN 1 END) as email_count,
                COUNT(CASE WHEN channel = 'sms' THEN 1 END) as sms_count,
                AVG(retry_count) as avg_retries
            FROM notifications
            WHERE 1=1
        `;
        
        const values = [];
        let valueIndex = 1;
        
        if (filters.date_from) {
            query += ` AND created_at >= $${valueIndex}`;
            values.push(filters.date_from);
            valueIndex++;
        }
        
        if (filters.date_to) {
            query += ` AND created_at <= $${valueIndex}`;
            values.push(filters.date_to);
            valueIndex++;
        }
        
        try {
            const result = await this.db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('[NotificationRepository] Error getting statistics:', error);
            throw error;
        }
    }

    /**
     * Delete old notifications (cleanup)
     */
    async deleteOldNotifications(daysOld = 90) {
        const query = `
            DELETE FROM notifications
            WHERE created_at < NOW() - INTERVAL '${daysOld} days'
            RETURNING id
        `;
        
        try {
            const result = await this.db.query(query);
            return result.rows.length;
        } catch (error) {
            console.error('[NotificationRepository] Error deleting old notifications:', error);
            throw error;
        }
    }

    /**
     * Helper: Map database row to notification object
     */
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

module.exports = { NotificationRepository };
