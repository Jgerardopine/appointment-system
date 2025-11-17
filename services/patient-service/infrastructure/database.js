// Database Connection for Patient Service
// Demonstrates: Connection Management, Resource Handling

const { Pool } = require('pg');

class Database {
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        // Handle errors
        this.pool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            client.release();
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Failed to connect to database:', error);
            throw error;
        }
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            // Log slow queries
            if (duration > 100) {
                console.log('Slow query detected', { text, duration, rows: res.rowCount });
            }
            
            return res;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
        console.log('Database connection closed');
    }
}

module.exports = { Database };
