// Authentication Service
// Demonstrates: Single Responsibility - Only handles authentication

const jwt = require('jsonwebtoken');

class AuthService {
    constructor(jwtSecret) {
        this.jwtSecret = jwtSecret;
        this.tokenExpiry = '7d';
    }

    generateToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.tokenExpiry
        });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            }
            throw error;
        }
    }

    extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            return null;
        }
        
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        
        return parts[1];
    }

    generateRefreshToken() {
        const payload = {
            type: 'refresh',
            random: Math.random().toString(36).substring(2)
        };
        
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: '30d'
        });
    }
}

module.exports = { AuthService };
