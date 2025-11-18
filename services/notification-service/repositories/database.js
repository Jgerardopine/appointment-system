// Database Connection for Notification Service
const { Pool } = require('pg');

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
            console.log('[Database] Query executed', { text, duration, rows: res.rowCount });
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

module.exports = { Database };