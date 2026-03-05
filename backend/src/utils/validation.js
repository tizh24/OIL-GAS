import Joi from "joi";

// Base validation rules
const passwordRules = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)');

const emailRules = Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .max(255)
    .required()
    .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required',
        'string.empty': 'Email cannot be empty'
    });

const nameRules = Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'string.pattern.base': 'Name can only contain letters and spaces',
        'any.required': 'Name is required',
        'string.empty': 'Name cannot be empty'
    });

const phoneRules = Joi.string()
    .pattern(/^(?:(?:\+84|84|0)([3|5|7|8|9])([0-9]{8})|[\+]?[1-9][\d]{0,15})$/)
    .optional()
    .messages({
        'string.pattern.base': 'Please enter a valid phone number (Vietnamese: +84901234567 or International: +1234567890)'
    });

const roleRules = Joi.string()
    .valid('admin', 'engineer', 'supervisor')
    .default('engineer')
    .messages({
        'any.only': 'Role must be one of: admin, engineer, supervisor'
    });

const departmentRules = Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
        'string.min': 'Department must be at least 2 characters long',
        'string.max': 'Department cannot exceed 100 characters'
    });

// Authentication Validation Schemas
export const loginValidationSchema = Joi.object({
    email: emailRules,
    password: Joi.string()
        .min(1)
        .required()
        .messages({
            'any.required': 'Password is required',
            'string.empty': 'Password cannot be empty'
        })
}).options({ stripUnknown: true });

export const registerValidationSchema = Joi.object({
    name: nameRules,
    email: emailRules,
    password: passwordRules.required().messages({
        'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Confirm password must match password',
            'any.required': 'Confirm password is required'
        }),
    phone: phoneRules,
    department: departmentRules,
    role: roleRules
}).options({ stripUnknown: true });

// User Management Validation Schemas
export const createUserValidationSchema = Joi.object({
    name: nameRules,
    email: emailRules,
    password: passwordRules.required().messages({
        'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Confirm password must match password',
            'any.required': 'Confirm password is required'
        }),
    phone: phoneRules,
    department: departmentRules,
    role: roleRules.required().messages({
        'any.required': 'Role is required when creating a user'
    })
}).options({ stripUnknown: true });

export const updateProfileValidationSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-Z\s]+$/)
        .optional()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'string.pattern.base': 'Name can only contain letters and spaces',
            'string.empty': 'Name cannot be empty'
        }),
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .lowercase()
        .max(255)
        .optional()
        .messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email cannot be empty'
        }),
    phone: phoneRules,
    department: departmentRules
}).min(1).options({ stripUnknown: true }).messages({
    'object.min': 'At least one field must be provided for update'
});

export const updateUserValidationSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-Z\s]+$/)
        .optional()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'string.pattern.base': 'Name can only contain letters and spaces',
            'string.empty': 'Name cannot be empty'
        }),
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .lowercase()
        .max(255)
        .optional()
        .messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email cannot be empty'
        }),
    phone: phoneRules,
    department: departmentRules,
    role: roleRules.optional(),
    status: Joi.string()
        .valid('active', 'inactive')
        .optional()
        .messages({
            'any.only': 'Status must be either active or inactive'
        })
}).min(1).options({ stripUnknown: true }).messages({
    'object.min': 'At least one field must be provided for update'
});

export const changePasswordValidationSchema = Joi.object({
    currentPassword: Joi.string()
        .min(1)
        .required()
        .messages({
            'any.required': 'Current password is required',
            'string.empty': 'Current password cannot be empty'
        }),
    newPassword: passwordRules.required().messages({
        'any.required': 'New password is required'
    }),
    confirmNewPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Confirm new password must match new password',
            'any.required': 'Confirm new password is required'
        })
}).options({ stripUnknown: true });

// Forgot Password Validation Schemas
export const forgotPasswordValidationSchema = Joi.object({
    email: emailRules
}).options({ stripUnknown: true });

export const resetPasswordValidationSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'any.required': 'Reset token is required',
            'string.empty': 'Reset token cannot be empty'
        }),
    newPassword: passwordRules.required().messages({
        'any.required': 'New password is required'
    }),
    confirmNewPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Confirm new password must match new password',
            'any.required': 'Confirm new password is required'
        })
}).options({ stripUnknown: true });

// ID Validation Schema
export const mongoIdValidationSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid ID format',
            'any.required': 'ID is required'
        })
});

// Query Validation Schemas
export const paginationValidationSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    search: Joi.string()
        .max(255)
        .optional()
        .messages({
            'string.max': 'Search query cannot exceed 255 characters'
        }),
    role: roleRules.optional(),
    status: Joi.string()
        .valid('active', 'inactive')
        .optional()
        .messages({
            'any.only': 'Status filter must be either active or inactive'
        })
}).options({ stripUnknown: true });

// Export validation helper function
export const validateSchema = (schema, data) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
    });

    if (error) {
        const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        return { isValid: false, errors, value: null };
    }

    return { isValid: true, errors: null, value };
};