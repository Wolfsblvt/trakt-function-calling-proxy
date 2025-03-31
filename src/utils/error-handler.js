/**
 * Error utilities for standardized API error handling
 */

/**
 * @typedef {object} ApiErrorResponse
 * @property {number} status - HTTP status code
 * @property {string} error - Error type
 * @property {string} message - Human-readable error message
 * @property {object} [details] - Additional error details
 */

/**
 * Base API error class with status code and details
 */
export class ApiError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} status - HTTP status code
     * @param {object} [details] - Additional error details
     */
    constructor(message, status = 500, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.details = details;
    }
}

/**
 * Error for validation failures (invalid parameters)
 */
export class ValidationError extends ApiError {
    /**
     * @param {string} message - Error message
     * @param {object} [details] - Additional error details
     */
    constructor(message, details = {}) {
        super(message, 400, details);
    }
}

/**
 * Error for parameter validation failures
 */
export class ParameterValidationError extends ValidationError {
    /**
     * @param {string} paramName - Name of the invalid parameter
     * @param {string} [reason='invalid_value'] - Reason for validation failure
     * @param {string} [message] - Custom error message
     * @param {object} [additionalDetails={}] - Additional error details
     */
    constructor(paramName, reason = 'invalid_value', message, additionalDetails = {}) {
        const errorMessage = message || `Invalid parameter: ${paramName}`;
        super(errorMessage, {
            param: paramName,
            reason,
            ...additionalDetails,
        });
    }
}

/**
 * Error for resource not found
 */
export class NotFoundError extends ApiError {
    /**
     * @param {string} resource - The resource that wasn't found
     * @param {string} [identifier] - Identifier that was used to look up the resource
     * @param {object} [additionalDetails={}] - Additional error details
     */
    constructor(resource, identifier, additionalDetails = {}) {
        const message = identifier
            ? `${resource} not found with identifier: ${identifier}`
            : `${resource} not found`;

        super(message, 404, {
            resource,
            ...(identifier ? { identifier } : {}),
            ...additionalDetails,
        });
    }
}

/**
 * Creates a standardized error response object
 * @param {Error} err - The error object
 * @returns {ApiErrorResponse} - Standardized error response
 */
export function createErrorResponse(err) {
    // If it's already an ApiError, use its properties
    if (err instanceof ApiError) {
        return {
            status: err.status,
            error: err.name,
            message: err.message,
            details: err.details,
        };
    }

    // Default to 500 internal server error for unexpected errors
    return {
        status: 500,
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? { originalError: err.message } : {},
    };
}
