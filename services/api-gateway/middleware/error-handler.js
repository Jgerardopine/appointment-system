// Error Handler Middleware - API Gateway

class ErrorHandler {
    handle(err, req, res, next) {
        console.error('Error occurred in API Gateway:', {
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        const statusCode = err.statusCode || 500;
        const message = statusCode === 500
            ? 'Internal server error'
            : err.message;

        res.status(statusCode).json({
            error: 'Error',
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
}

module.exports = { ErrorHandler };
