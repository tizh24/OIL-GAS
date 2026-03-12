import AuditLog from "../models/admin/auditLog.model.js";

/**
 * Log audit trail for admin actions
 * @param {Object} options - Audit options
 * @param {string} options.action - Action performed (CREATE, UPDATE, DELETE)
 * @param {string} options.entity - Entity type (Equipment, Instrument, etc.)
 * @param {string} options.entityId - ID of the entity
 * @param {string} options.performedBy - User ID who performed the action
 * @param {Object} options.before - Previous state of entity (for updates)
 * @param {Object} options.after - New state of entity
 * @param {string} options.reason - Reason for action (optional)
 * @param {Object} options.req - Express request object for IP and user agent
 */
export const logAudit = async (options) => {
    try {
        const {
            action,
            entity,
            entityId,
            performedBy,
            before,
            after,
            reason,
            req
        } = options;

        const auditEntry = {
            entity,
            entityId,
            action,
            performedBy,
            before: before || null,
            after: after || null,
            reason: reason || null,
            ipAddress: req?.ip || req?.connection?.remoteAddress || 'unknown',
            userAgent: req?.get('User-Agent') || 'unknown'
        };

        await AuditLog.create(auditEntry);
    } catch (error) {
        console.error('Failed to log audit:', error.message);
        // Don't throw error to prevent audit logging from breaking main operations
    }
};

/**
 * Log bulk audit entries
 * @param {Array} entries - Array of audit entries
 */
export const logBulkAudit = async (entries) => {
    try {
        await AuditLog.insertMany(entries);
    } catch (error) {
        console.error('Failed to log bulk audit:', error.message);
    }
};
