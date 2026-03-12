import mongoose from "mongoose";

/**
 * AuditLog – immutable record of every significant admin/system action.
 * Never updated or soft-deleted; retained permanently for compliance (SRS §54, §57, §63, §73).
 */
const auditLogSchema = new mongoose.Schema(
    {
        // WHO performed the action
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        performedByRole: {
            type: String,
            enum: ["admin", "engineer", "supervisor"],
            required: true
        },

        // WHAT action was performed
        action: {
            type: String,
            required: true,
            enum: [
                // User management
                "CREATE_USER", "UPDATE_USER", "DELETE_USER", "RESTORE_USER",
                // Role management
                "CREATE_ROLE", "UPDATE_ROLE", "DELETE_ROLE",
                // Equipment management
                "CREATE_EQUIPMENT", "UPDATE_EQUIPMENT", "DELETE_EQUIPMENT",
                // Instrument management
                "CREATE_INSTRUMENT", "UPDATE_INSTRUMENT", "DELETE_INSTRUMENT",
                // Warehouse management
                "CREATE_WAREHOUSE", "UPDATE_WAREHOUSE", "DELETE_WAREHOUSE",
                // Maintenance management
                "CREATE_MAINTENANCE", "UPDATE_MAINTENANCE", "COMPLETE_MAINTENANCE", "CANCEL_MAINTENANCE",
                // Auth events
                "LOGIN", "LOGOUT", "LOGIN_FAILED", "ACCOUNT_LOCKED", "PASSWORD_CHANGED"
            ],
            index: true
        },

        // ON WHAT resource
        resourceType: {
            type: String,
            required: true,
            enum: ["User", "Role", "Equipment", "Instrument", "Warehouse", "MaintenanceRecord", "Auth"]
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true
        },

        // REASON (required for destructive operations)
        reason: {
            type: String,
            default: null,
            maxlength: 500
        },

        // BEFORE / AFTER snapshot (optional but recommended)
        oldValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        newValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        // Additional context
        ipAddress: {
            type: String,
            default: null
        },
        userAgent: {
            type: String,
            default: null
        },

        // Status of the action
        status: {
            type: String,
            enum: ["success", "failure"],
            default: "success"
        },
        errorMessage: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true   // createdAt = official audit timestamp
    }
);

// Compound indexes for common query patterns
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
