const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = {
            message,
            statusCode: 404
        };
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        let message = 'Duplicate field value entered';
        
        // Extract field name from error
        const field = Object.keys(err.keyValue)[0];
        if (field) {
            message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        }
        
        error = {
            message,
            statusCode: 400
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            message,
            statusCode: 400
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            message: 'Invalid token',
            statusCode: 401
        };
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            message: 'Token expired',
            statusCode: 401
        };
    }

    // Multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = {
            message: 'File too large',
            statusCode: 400
        };
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        error = {
            message: 'Too many files',
            statusCode: 400
        };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = {
            message: 'Unexpected file field',
            statusCode: 400
        };
    }

    // Default error response
    const statusCode = error.statusCode || err.statusCode || 500;
    const message = error.message || 'Server Error';

    // Don't leak error details in production
    const response = {
        success: false,
        message
    };

    // Add error details in development
    if (process.env.NODE_ENV === 'development') {
        response.error = err;
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;