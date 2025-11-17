// Error Handler Middleware
// Demonstrates: Centralized Error Handling, Single Responsibility

class ErrorHandler {
    handle(err, req, res, next) {
        // Log error
        console.error('Error occurred:', {
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        // Handle specific error types
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation Error',
                message: err.message,
                details: err.details || {}
            });
        }

        if (err.name === 'UnauthorizedError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (err.code === '23505') { // PostgreSQL unique violation
            return res.status(409).json({
                error: 'Conflict',
                message: 'Resource already exists'
            });
        }

        if (err.code === '23503') { // PostgreSQL foreign key violation
            return res.status(400).json({
                error: 'Invalid Reference',
                message: 'Referenced resource does not exist'
            });
        }

        // Default error response
        const statusCode = err.statusCode || 500;
        const message = statusCode === 500 
            ? 'Internal server error' 
            : err.message;

        res.status(statusCode).json({
            error: 'Error',
            message: message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack
            })
        });
    }
}

module.exports = { ErrorHandler };
