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

// Incident & Alert Validation Schemas
export const createIncidentValidationSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
            'string.min': 'Incident title must be at least 3 characters long',
            'string.max': 'Incident title must be less than 255 characters',
            'any.required': 'Incident title is required'
        }),
    description: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description must be less than 2000 characters',
            'any.required': 'Incident description is required'
        }),
    severity: Joi.string()
        .valid('low', 'medium', 'high', 'critical')
        .required()
        .messages({
            'any.only': 'Severity must be one of: low, medium, high, critical',
            'any.required': 'Severity is required'
        }),
    incidentType: Joi.string()
        .valid('equipment_failure', 'safety_violation', 'environmental_incident', 'operational_issue', 'maintenance_required', 'security_breach', 'other')
        .required()
        .messages({
            'any.only': 'Incident type must be one of: equipment_failure, safety_violation, environmental_incident, operational_issue, maintenance_required, security_breach, other',
            'any.required': 'Incident type is required'
        }),
    location: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
            'string.min': 'Location must be at least 3 characters long',
            'string.max': 'Location must be less than 255 characters',
            'any.required': 'Location is required'
        }),
    equipment: Joi.string()
        .min(2)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Equipment name must be at least 2 characters long',
            'string.max': 'Equipment name must be less than 255 characters'
        }),
    instrument: Joi.string()
        .min(2)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Instrument name must be at least 2 characters long',
            'string.max': 'Instrument name must be less than 255 characters'
        }),
    assignedTo: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Assigned user must be a valid user ID'
        }),
    priority: Joi.string()
        .valid('low', 'medium', 'high', 'urgent')
        .default('medium')
        .messages({
            'any.only': 'Priority must be one of: low, medium, high, urgent'
        }),
    estimatedResolutionTime: Joi.date()
        .greater('now')
        .optional()
        .messages({
            'date.greater': 'Estimated resolution time must be in the future'
        })
}).options({ stripUnknown: true });

export const updateIncidentValidationSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Incident title must be at least 3 characters long',
            'string.max': 'Incident title must be less than 255 characters'
        }),
    description: Joi.string()
        .min(10)
        .max(2000)
        .optional()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description must be less than 2000 characters'
        }),
    severity: Joi.string()
        .valid('low', 'medium', 'high', 'critical')
        .optional()
        .messages({
            'any.only': 'Severity must be one of: low, medium, high, critical'
        }),
    status: Joi.string()
        .valid('open', 'in_progress', 'resolved', 'closed')
        .optional()
        .messages({
            'any.only': 'Status must be one of: open, in_progress, resolved, closed'
        }),
    incidentType: Joi.string()
        .valid('equipment_failure', 'safety_violation', 'environmental_incident', 'operational_issue', 'maintenance_required', 'security_breach', 'other')
        .optional()
        .messages({
            'any.only': 'Incident type must be one of: equipment_failure, safety_violation, environmental_incident, operational_issue, maintenance_required, security_breach, other'
        }),
    location: Joi.string()
        .min(3)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Location must be at least 3 characters long',
            'string.max': 'Location must be less than 255 characters'
        }),
    equipment: Joi.string()
        .min(2)
        .max(255)
        .allow(null, '')
        .optional()
        .messages({
            'string.min': 'Equipment name must be at least 2 characters long',
            'string.max': 'Equipment name must be less than 255 characters'
        }),
    instrument: Joi.string()
        .min(2)
        .max(255)
        .allow(null, '')
        .optional()
        .messages({
            'string.min': 'Instrument name must be at least 2 characters long',
            'string.max': 'Instrument name must be less than 255 characters'
        }),
    assignedTo: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .allow(null)
        .optional()
        .messages({
            'string.pattern.base': 'Assigned user must be a valid user ID'
        }),
    priority: Joi.string()
        .valid('low', 'medium', 'high', 'urgent')
        .optional()
        .messages({
            'any.only': 'Priority must be one of: low, medium, high, urgent'
        }),
    estimatedResolutionTime: Joi.date()
        .allow(null)
        .optional()
        .messages({
            'date.base': 'Estimated resolution time must be a valid date'
        }),
    resolution: Joi.string()
        .min(10)
        .max(2000)
        .optional()
        .messages({
            'string.min': 'Resolution must be at least 10 characters long',
            'string.max': 'Resolution must be less than 2000 characters'
        })
}).options({ stripUnknown: true });

export const incidentCommentValidationSchema = Joi.object({
    comment: Joi.string()
        .min(5)
        .max(1000)
        .required()
        .messages({
            'string.min': 'Comment must be at least 5 characters long',
            'string.max': 'Comment must be less than 1000 characters',
            'any.required': 'Comment is required'
        })
}).options({ stripUnknown: true });

export const incidentFilterValidationSchema = Joi.object({
    severity: Joi.string()
        .valid('low', 'medium', 'high', 'critical')
        .optional()
        .messages({
            'any.only': 'Severity must be one of: low, medium, high, critical'
        }),
    status: Joi.string()
        .valid('open', 'in_progress', 'resolved', 'closed')
        .optional()
        .messages({
            'any.only': 'Status must be one of: open, in_progress, resolved, closed'
        }),
    incidentType: Joi.string()
        .valid('equipment_failure', 'safety_violation', 'environmental_incident', 'operational_issue', 'maintenance_required', 'security_breach', 'other')
        .optional()
        .messages({
            'any.only': 'Incident type must be valid'
        }),
    instrument: Joi.string()
        .min(1)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Instrument filter must be at least 1 character',
            'string.max': 'Instrument filter must be less than 255 characters'
        }),
    equipment: Joi.string()
        .min(1)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Equipment filter must be at least 1 character',
            'string.max': 'Equipment filter must be less than 255 characters'
        }),
    startDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'Start date must be a valid date'
        }),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .optional()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.min': 'End date must be after start date'
        }),
    assignedTo: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Assigned user must be a valid user ID'
        }),
    reportedBy: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Reported by user must be a valid user ID'
        }),
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
            'number.max': 'Limit must be at most 100'
        })
}).options({ stripUnknown: true });

// Alert Validation Schemas
export const createAlertValidationSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
            'string.min': 'Alert title must be at least 3 characters long',
            'string.max': 'Alert title must be less than 255 characters',
            'any.required': 'Alert title is required'
        }),
    description: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description must be less than 1000 characters',
            'any.required': 'Alert description is required'
        }),
    severity: Joi.string()
        .valid('info', 'warning', 'error', 'critical')
        .required()
        .messages({
            'any.only': 'Severity must be one of: info, warning, error, critical',
            'any.required': 'Severity is required'
        }),
    alertType: Joi.string()
        .valid('system', 'equipment', 'safety', 'environmental', 'operational', 'maintenance', 'security')
        .required()
        .messages({
            'any.only': 'Alert type must be one of: system, equipment, safety, environmental, operational, maintenance, security',
            'any.required': 'Alert type is required'
        }),
    source: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
            'string.min': 'Source must be at least 2 characters long',
            'string.max': 'Source must be less than 255 characters',
            'any.required': 'Alert source is required'
        }),
    equipment: Joi.string()
        .min(2)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Equipment name must be at least 2 characters long',
            'string.max': 'Equipment name must be less than 255 characters'
        }),
    instrument: Joi.string()
        .min(2)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Instrument name must be at least 2 characters long',
            'string.max': 'Instrument name must be less than 255 characters'
        }),
    threshold: Joi.object({
        value: Joi.number().required(),
        unit: Joi.string().max(20).required(),
        condition: Joi.string().valid('greater_than', 'less_than', 'equal_to', 'not_equal_to').required()
    }).optional(),
    priority: Joi.string()
        .valid('low', 'medium', 'high', 'urgent')
        .default('medium')
        .messages({
            'any.only': 'Priority must be one of: low, medium, high, urgent'
        })
}).options({ stripUnknown: true });

export const updateAlertValidationSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Alert title must be at least 3 characters long',
            'string.max': 'Alert title must be less than 255 characters'
        }),
    description: Joi.string()
        .min(10)
        .max(1000)
        .optional()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description must be less than 1000 characters'
        }),
    severity: Joi.string()
        .valid('info', 'warning', 'error', 'critical')
        .optional()
        .messages({
            'any.only': 'Severity must be one of: info, warning, error, critical'
        }),
    status: Joi.string()
        .valid('active', 'acknowledged', 'resolved')
        .optional()
        .messages({
            'any.only': 'Status must be one of: active, acknowledged, resolved'
        }),
    alertType: Joi.string()
        .valid('system', 'equipment', 'safety', 'environmental', 'operational', 'maintenance', 'security')
        .optional()
        .messages({
            'any.only': 'Alert type must be one of: system, equipment, safety, environmental, operational, maintenance, security'
        }),
    source: Joi.string()
        .min(2)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Source must be at least 2 characters long',
            'string.max': 'Source must be less than 255 characters'
        }),
    equipment: Joi.string()
        .min(2)
        .max(255)
        .allow(null, '')
        .optional()
        .messages({
            'string.min': 'Equipment name must be at least 2 characters long',
            'string.max': 'Equipment name must be less than 255 characters'
        }),
    instrument: Joi.string()
        .min(2)
        .max(255)
        .allow(null, '')
        .optional()
        .messages({
            'string.min': 'Instrument name must be at least 2 characters long',
            'string.max': 'Instrument name must be less than 255 characters'
        }),
    threshold: Joi.object({
        value: Joi.number().required(),
        unit: Joi.string().max(20).required(),
        condition: Joi.string().valid('greater_than', 'less_than', 'equal_to', 'not_equal_to').required()
    }).allow(null).optional(),
    priority: Joi.string()
        .valid('low', 'medium', 'high', 'urgent')
        .optional()
        .messages({
            'any.only': 'Priority must be one of: low, medium, high, urgent'
        })
}).options({ stripUnknown: true });

export const acknowledgeAlertValidationSchema = Joi.object({
    acknowledgmentNote: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Acknowledgment note must be less than 500 characters'
        })
}).options({ stripUnknown: true });

export const alertFilterValidationSchema = Joi.object({
    severity: Joi.string()
        .valid('info', 'warning', 'error', 'critical')
        .optional()
        .messages({
            'any.only': 'Severity must be one of: info, warning, error, critical'
        }),
    status: Joi.string()
        .valid('active', 'acknowledged', 'resolved')
        .optional()
        .messages({
            'any.only': 'Status must be one of: active, acknowledged, resolved'
        }),
    alertType: Joi.string()
        .valid('system', 'equipment', 'safety', 'environmental', 'operational', 'maintenance', 'security')
        .optional()
        .messages({
            'any.only': 'Alert type must be valid'
        }),
    instrument: Joi.string()
        .min(1)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Instrument filter must be at least 1 character',
            'string.max': 'Instrument filter must be less than 255 characters'
        }),
    equipment: Joi.string()
        .min(1)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Equipment filter must be at least 1 character',
            'string.max': 'Equipment filter must be less than 255 characters'
        }),
    source: Joi.string()
        .min(1)
        .max(255)
        .optional()
        .messages({
            'string.min': 'Source filter must be at least 1 character',
            'string.max': 'Source filter must be less than 255 characters'
        }),
    startDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'Start date must be a valid date'
        }),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .optional()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.min': 'End date must be after start date'
        }),
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
            'number.max': 'Limit must be at most 100'
        })
}).options({ stripUnknown: true });

export const bulkAcknowledgeAlertsValidationSchema = Joi.object({
    alertIds: Joi.array()
        .items(
            Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.pattern.base': 'Each alert ID must be a valid MongoDB ObjectId'
                })
        )
        .min(1)
        .max(50)
        .unique()
        .required()
        .messages({
            'array.min': 'At least 1 alert ID is required',
            'array.max': 'Cannot acknowledge more than 50 alerts at once',
            'array.unique': 'Alert IDs must be unique',
            'any.required': 'Alert IDs are required'
        }),
    acknowledgmentNote: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Acknowledgment note must be less than 500 characters'
        })
}).options({ stripUnknown: true });

// ==================== ADMIN VALIDATION SCHEMAS ====================

// Admin Management Validation Schemas
export const createAdminValidationSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required()
        .messages({
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
            'any.required': 'Username is required'
        }),
    email: emailRules,
    password: passwordRules.required(),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Confirm password must match password',
            'any.required': 'Confirm password is required'
        }),
    role: Joi.string()
        .valid('admin', 'super_admin')
        .default('admin')
        .messages({
            'any.only': 'Role must be either admin or super_admin'
        })
}).options({ stripUnknown: true });

export const updateAdminValidationSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .optional()
        .messages({
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'string.pattern.base': 'Username can only contain letters, numbers, and underscores'
        }),
    email: emailRules.optional(),
    password: passwordRules.optional(),
    role: Joi.string()
        .valid('admin', 'super_admin')
        .optional()
        .messages({
            'any.only': 'Role must be either admin or super_admin'
        })
}).options({ stripUnknown: true });

export const adminLoginValidationSchema = Joi.object({
    email: emailRules,
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required',
            'string.empty': 'Password cannot be empty'
        })
}).options({ stripUnknown: true });

// Equipment Management Validation Schemas (Admin)
export const createEquipmentValidationSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Equipment name must be at least 2 characters long',
            'string.max': 'Equipment name cannot exceed 100 characters',
            'any.required': 'Equipment name is required'
        }),
    type: Joi.string()
        .valid('drilling', 'pumping', 'safety', 'measurement', 'transportation', 'other')
        .required()
        .messages({
            'any.only': 'Type must be one of: drilling, pumping, safety, measurement, transportation, other',
            'any.required': 'Equipment type is required'
        }),
    serial: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.min': 'Serial number must be at least 3 characters long',
            'string.max': 'Serial number cannot exceed 50 characters',
            'any.required': 'Serial number is required'
        }),
    model: Joi.string()
        .max(100)
        .required()
        .messages({
            'string.max': 'Model cannot exceed 100 characters',
            'any.required': 'Model is required'
        }),
    manufacturer: Joi.string()
        .max(100)
        .required()
        .messages({
            'string.max': 'Manufacturer cannot exceed 100 characters',
            'any.required': 'Manufacturer is required'
        }),
    location: Joi.string()
        .max(200)
        .required()
        .messages({
            'string.max': 'Location cannot exceed 200 characters',
            'any.required': 'Location is required'
        }),
    status: Joi.string()
        .valid('operational', 'maintenance', 'out-of-service', 'repair', 'inspection')
        .default('operational')
        .messages({
            'any.only': 'Status must be one of: operational, maintenance, out-of-service, repair, inspection'
        }),
    purchaseDate: Joi.date().optional(),
    warrantyExpiry: Joi.date().optional(),
    nextScheduledMaintenance: Joi.date().optional(),
    specifications: Joi.object().optional(),
    description: Joi.string().max(1000).optional()
}).options({ stripUnknown: true });

export const updateEquipmentValidationSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    type: Joi.string().valid('drilling', 'pumping', 'safety', 'measurement', 'transportation', 'other').optional(),
    model: Joi.string().max(100).optional(),
    manufacturer: Joi.string().max(100).optional(),
    location: Joi.string().max(200).optional(),
    status: Joi.string().valid('operational', 'maintenance', 'out-of-service', 'repair', 'inspection').optional(),
    purchaseDate: Joi.date().optional(),
    warrantyExpiry: Joi.date().optional(),
    nextScheduledMaintenance: Joi.date().optional(),
    specifications: Joi.object().optional(),
    description: Joi.string().max(1000).optional()
}).options({ stripUnknown: true });

// Warehouse Management Validation Schemas
export const createWarehouseValidationSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Warehouse name must be at least 2 characters long',
            'string.max': 'Warehouse name cannot exceed 100 characters',
            'any.required': 'Warehouse name is required'
        }),
    location: Joi.string()
        .min(2)
        .max(200)
        .required()
        .messages({
            'string.min': 'Location must be at least 2 characters long',
            'string.max': 'Location cannot exceed 200 characters',
            'any.required': 'Location is required'
        }),
    capacity: Joi.number()
        .positive()
        .required()
        .messages({
            'number.positive': 'Capacity must be a positive number',
            'any.required': 'Capacity is required'
        }),
    description: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        })
}).options({ stripUnknown: true });

export const updateWarehouseValidationSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    location: Joi.string().min(2).max(200).optional(),
    capacity: Joi.number().positive().optional(),
    description: Joi.string().max(500).optional()
}).options({ stripUnknown: true });

export const warehouseInventoryValidationSchema = Joi.object({
    warehouseId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid warehouse ID format',
            'any.required': 'Warehouse ID is required'
        }),
    equipmentId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Invalid equipment ID format'
        }),
    quantity: Joi.number()
        .positive()
        .required()
        .messages({
            'number.positive': 'Quantity must be a positive number',
            'any.required': 'Quantity is required'
        }),
    supplierOrDestination: Joi.string()
        .min(2)
        .max(200)
        .required()
        .messages({
            'string.min': 'Supplier/Destination must be at least 2 characters long',
            'string.max': 'Supplier/Destination cannot exceed 200 characters',
            'any.required': 'Supplier or Destination is required'
        }),
    actionDate: Joi.date().optional(),
    note: Joi.string().max(500).optional()
}).options({ stripUnknown: true });



// Maintenance Management Validation Schemas
export const createMaintenanceValidationSchema = Joi.object({
    equipment: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid equipment ID format',
            'any.required': 'Equipment is required'
        }),
    type: Joi.string()
        .valid('preventive', 'corrective', 'predictive', 'emergency', 'inspection', 'calibration')
        .required()
        .messages({
            'any.only': 'Type must be one of: preventive, corrective, predictive, emergency, inspection, calibration',
            'any.required': 'Maintenance type is required'
        }),
    description: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description cannot exceed 1000 characters',
            'any.required': 'Description is required'
        }),
    scheduledDate: Joi.date()
        .required()
        .messages({
            'any.required': 'Scheduled date is required'
        }),
    estimatedHours: Joi.number()
        .positive()
        .optional()
        .messages({
            'number.positive': 'Estimated hours must be a positive number'
        }),
    engineerId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid engineer ID format',
            'any.required': 'Engineer ID is required'
        }),
    supervisorId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Invalid supervisor ID format'
        }),
    priority: Joi.string()
        .valid('low', 'medium', 'high', 'critical')
        .default('medium')
        .messages({
            'any.only': 'Priority must be one of: low, medium, high, critical'
        }),
    partsUsed: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        cost: Joi.number().positive().optional()
    })).optional()
}).options({ stripUnknown: true });

export const updateMaintenanceValidationSchema = Joi.object({
    type: Joi.string().valid('preventive', 'corrective', 'predictive', 'emergency', 'inspection', 'calibration').optional(),
    status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled', 'delayed').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    scheduledDate: Joi.date().optional(),
    startDate: Joi.date().optional(),
    completedDate: Joi.date().optional(),
    estimatedHours: Joi.number().positive().optional(),
    actualHours: Joi.number().positive().optional(),
    engineerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    supervisorId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    description: Joi.string().min(10).max(1000).optional(),
    workPerformed: Joi.string().max(2000).optional(),
    partsUsed: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        cost: Joi.number().positive().optional()
    })).optional(),
    findings: Joi.string().max(1000).optional(),
    cost: Joi.number().positive().optional(),
    notes: Joi.string().max(1000).optional(),
    nextMaintenanceDate: Joi.date().optional()
}).options({ stripUnknown: true });

// Instrument Management Validation Schemas
export const createInstrumentValidationSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Instrument name must be at least 2 characters long',
            'string.max': 'Instrument name cannot exceed 100 characters',
            'any.required': 'Instrument name is required'
        }),
    type: Joi.string()
        .valid('pressure', 'temperature', 'flow', 'level', 'ph', 'gas', 'vibration', 'other')
        .required()
        .messages({
            'any.only': 'Type must be one of: pressure, temperature, flow, level, ph, gas, vibration, other',
            'any.required': 'Instrument type is required'
        }),
    model: Joi.string().max(100).required(),
    manufacturer: Joi.string().max(100).required(),
    serialNumber: Joi.string().min(3).max(50).required(),
    location: Joi.string().max(200).required(),
    unit: Joi.string().max(20).optional(),
    range: Joi.object({
        min: Joi.number().required(),
        max: Joi.number().greater(Joi.ref('min')).required()
    }).optional(),
    calibrationDate: Joi.date().optional(),
    nextCalibrationDate: Joi.date().optional(),
    status: Joi.string()
        .valid('active', 'inactive', 'maintenance', 'calibration')
        .default('active')
        .messages({
            'any.only': 'Status must be one of: active, inactive, maintenance, calibration'
        })
}).options({ stripUnknown: true });

export const updateInstrumentValidationSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    type: Joi.string().valid('pressure', 'temperature', 'flow', 'level', 'ph', 'gas', 'vibration', 'other').optional(),
    model: Joi.string().max(100).optional(),
    manufacturer: Joi.string().max(100).optional(),
    location: Joi.string().max(200).optional(),
    unit: Joi.string().max(20).optional(),
    range: Joi.object({
        min: Joi.number().required(),
        max: Joi.number().greater(Joi.ref('min')).required()
    }).optional(),
    calibrationDate: Joi.date().optional(),
    nextCalibrationDate: Joi.date().optional(),
    status: Joi.string().valid('active', 'inactive', 'maintenance', 'calibration').optional()
}).options({ stripUnknown: true });

// Role Management Validation Schemas
export const createRoleValidationSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Role name must be at least 2 characters long',
            'string.max': 'Role name cannot exceed 50 characters',
            'any.required': 'Role name is required'
        }),
    description: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
    permissions: Joi.array()
        .items(Joi.string())
        .default([])
        .messages({
            'array.base': 'Permissions must be an array of strings'
        })
}).options({ stripUnknown: true });

export const updateRoleValidationSchema = Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(500).optional(),
    permissions: Joi.array().items(Joi.string()).optional()
}).options({ stripUnknown: true });