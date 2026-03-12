import { error as errorResponse, success } from '../utils/response.js';

// 404 Not Found handler
export const notFound = (req, res, next) => {
    return errorResponse(res, 404, `Not Found - ${req.originalUrl}`);
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err);

    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Avoid leaking stack in production
    const details = process.env.NODE_ENV !== 'production' ? { stack: err.stack } : undefined;

    return errorResponse(res, status, message, details);
};
