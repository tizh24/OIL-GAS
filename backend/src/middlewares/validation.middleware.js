import { validateSchema } from '../utils/validation.js';
import { error as errorResponse } from '../utils/response.js';
import Joi from 'joi';

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            let dataToValidate;

            // Determine which part of the request to validate
            switch (source) {
                case 'body':
                    dataToValidate = req.body;
                    break;
                case 'params':
                    dataToValidate = req.params;
                    break;
                case 'query':
                    dataToValidate = req.query;
                    break;
                default:
                    return errorResponse(res, 500, 'Invalid validation source');
            }

            // Perform validation
            const { isValid, errors, value } = validateSchema(schema, dataToValidate);

            if (!isValid) {
                // Format error response with field-specific messages
                const formattedErrors = errors.reduce((acc, error) => {
                    acc[error.field] = error.message;
                    return acc;
                }, {});

                return errorResponse(res, 400, 'Validation failed', {
                    errors: formattedErrors,
                    message: 'Please check the following fields and try again'
                });
            }

            // Replace the original data with validated and sanitized data
            if (source === 'body') req.body = value;
            if (source === 'params') req.params = value;
            if (source === 'query') req.query = value;

            next();
        } catch (err) {
            console.error('Validation middleware error:', err);
            return errorResponse(res, 500, 'Validation error occurred');
        }
    };
};

/**
 * Validation middleware for request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validation middleware for request parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Validation middleware for query parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Multiple validation middleware - validates multiple parts of request
 * @param {Object} validations - Object with body, params, query schemas
 * @returns {Function} Express middleware function
 */
export const validateMultiple = (validations) => {
    return (req, res, next) => {
        try {
            const errors = {};
            let hasErrors = false;

            // Validate each specified part
            Object.keys(validations).forEach(source => {
                const schema = validations[source];
                let dataToValidate;

                switch (source) {
                    case 'body':
                        dataToValidate = req.body;
                        break;
                    case 'params':
                        dataToValidate = req.params;
                        break;
                    case 'query':
                        dataToValidate = req.query;
                        break;
                    default:
                        return;
                }

                const { isValid, errors: validationErrors, value } = validateSchema(schema, dataToValidate);

                if (!isValid) {
                    hasErrors = true;
                    validationErrors.forEach(error => {
                        errors[`${source}.${error.field}`] = error.message;
                    });
                } else {
                    // Replace with validated data
                    if (source === 'body') req.body = value;
                    if (source === 'params') req.params = value;
                    if (source === 'query') req.query = value;
                }
            });

            if (hasErrors) {
                return errorResponse(res, 400, 'Validation failed', {
                    errors,
                    message: 'Please check the following fields and try again'
                });
            }

            next();
        } catch (err) {
            console.error('Multiple validation middleware error:', err);
            return errorResponse(res, 500, 'Validation error occurred');
        }
    };
};

/**
 * Custom validation middleware for specific business logic
 * @param {Function} validator - Custom validation function
 * @returns {Function} Express middleware function
 */
export const customValidate = (validator) => {
    return async (req, res, next) => {
        try {
            const result = await validator(req, res);

            if (result && result.isValid === false) {
                return errorResponse(res, result.statusCode || 400, result.message || 'Validation failed', result.errors);
            }

            next();
        } catch (err) {
            console.error('Custom validation error:', err);
            return errorResponse(res, 500, 'Validation error occurred');
        }
    };
};

/**
 * Sanitization middleware - removes potentially harmful content
 * @param {Array} fields - Fields to sanitize
 * @returns {Function} Express middleware function
 */
export const sanitize = (fields = []) => {
    return (req, res, next) => {
        try {
            const sanitizeValue = (value) => {
                if (typeof value === 'string') {
                    // Remove HTML tags and trim whitespace
                    return value.replace(/<[^>]*>?/gm, '').trim();
                }
                return value;
            };

            // Sanitize specified fields or all string fields
            const fieldsToSanitize = fields.length > 0 ? fields : Object.keys(req.body);

            fieldsToSanitize.forEach(field => {
                if (req.body[field] !== undefined) {
                    req.body[field] = sanitizeValue(req.body[field]);
                }
            });

            next();
        } catch (err) {
            console.error('Sanitization error:', err);
            next(); // Continue even if sanitization fails
        }
    };
};

// Export common validation patterns
export const commonValidations = {
    mongoId: (paramName = 'id') => ({
        [paramName]: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),

    pagination: {
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }
};