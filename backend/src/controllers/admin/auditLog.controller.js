import AuditLog from "../../models/admin/auditLog.model.js";
import { success, error } from "../../utils/response.js";

// ── GET /api/admin/auditlogs ──────────────────────────────────────────────────
export const getAuditLogs = async (req, res) => {
    try {
        const {
            page         = 1,
            limit        = 20,
            action,
            resourceType,
            performedBy,
            status,
            startDate,
            endDate
        } = req.query;

        const filter = {};
        if (action)       filter.action       = action;
        if (resourceType) filter.resourceType = resourceType;
        if (performedBy)  filter.performedBy  = performedBy;
        if (status)       filter.status       = status;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate)   filter.createdAt.$lte = new Date(endDate);
        }

        const pageNum  = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip     = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate("performedBy", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            AuditLog.countDocuments(filter)
        ]);

        return success(res, "Audit logs retrieved successfully", {
            logs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve audit logs");
    }
};

// ── GET /api/admin/auditlogs/:id ──────────────────────────────────────────────
export const getAuditLogById = async (req, res) => {
    try {
        const log = await AuditLog.findById(req.params.id)
            .populate("performedBy", "name email role");
        if (!log) return error(res, 404, "Audit log entry not found");
        return success(res, "Audit log entry retrieved successfully", log);
    } catch (err) {
        return error(res, 500, "Failed to retrieve audit log entry");
    }
};
