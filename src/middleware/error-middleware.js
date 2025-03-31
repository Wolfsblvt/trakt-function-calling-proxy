import { ApiError, createErrorResponse } from '../utils/error-handler.js';

/**
 * Global error handling middleware
 * @param {Error|ApiError} err - The error object
 * @param {import('express').Request} _ - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} _next - Express next function (unused)
 */
export function errorMiddleware(err, _, res, _next) {
    console.error(`[ERROR] ${err.name}: ${err.message}`);

    // Only log stack traces for unexpected errors (not validation/client errors)
    if (err.stack && (err instanceof ApiError ? err.status : 500) >= 500) {
        console.error(err.stack);
    }

    // Create standardized error response
    const errorResponse = createErrorResponse(err);

    // Send response with appropriate status code
    res.status(errorResponse.status).json(errorResponse);
}
