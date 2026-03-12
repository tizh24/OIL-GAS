import MaintenanceHistory from "../../models/admin/maintenanceHistory.model.js";
import { success, error } from "../../utils/response.js";
import mongoose from "mongoose";

// ── GET /api/admin/maintenance ────────────────────────────────────────────────
export const getMaintenanceHistory = async (req, res) => {
    try {
        const {
            page = 1, limit = 20, status, type, priority,
            equipmentId, instrumentId, performedBy,
            startDate, endDate
        } = req.query;

        const filter = {};
        if (status)       filter.status       = status;
        if (type)         filter.type         = type;
        if (priority)     filter.priority     = priority;
        if (equipmentId)  filter.equipmentId  = equipmentId;
        if (instrumentId) filter.instrumentId = instrumentId;
        if (performedBy)  filter.performedBy  = performedBy;
        if (startDate || endDate) {
            filter.scheduledDate = {};
            if (startDate) filter.scheduledDate.$gte = new Date(startDate);
            if (endDate)   filter.scheduledDate.$lte = new Date(endDate);
        }

        const pageNum  = Math.max(1, Number(page));
        const limitNum = Math.min(100, Number(limit));
        const skip     = (pageNum - 1) * limitNum;

        const [records, total] = await Promise.all([
            MaintenanceHistory.find(filter)
                .populate("equipmentId", "name serial type")
                .populate("instrumentId", "name serial type")
                .populate("performedBy createdBy", "name email")
                .sort({ scheduledDate: -1 })
                .skip(skip)
                .limit(limitNum),
            MaintenanceHistory.countDocuments(filter)
        ]);

        return success(res, "Maintenance history retrieved successfully", {
            records,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance history");
    }
};

// ── GET /api/admin/maintenance/:id ────────────────────────────────────────────
export const getMaintenanceById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return error(res, 400, "Invalid maintenance record ID");

        const record = await MaintenanceHistory.findById(req.params.id)
            .populate("equipmentId", "name serial type location")
            .populate("instrumentId", "name serial type location")
            .populate("performedBy createdBy", "name email department");

        if (!record) return error(res, 404, "Maintenance record not found");
        return success(res, "Maintenance record retrieved successfully", record);
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance record");
    }
};

// ── POST /api/admin/maintenance ───────────────────────────────────────────────
export const createMaintenance = async (req, res) => {
    try {
        const {
            equipmentId, instrumentId, type, description, status,
            priority, scheduledDate, estimatedHours, cost, performedBy, notes
        } = req.body;

        if (!type)          return error(res, 400, "Type is required");
        if (!description)   return error(res, 400, "Description is required");
        if (!scheduledDate) return error(res, 400, "Scheduled date is required");
        if (!equipmentId && !instrumentId)
            return error(res, 400, "Either equipmentId or instrumentId must be provided");

        const record = await MaintenanceHistory.create({
            equipmentId:  equipmentId  || null,
            instrumentId: instrumentId || null,
            type, description, status, priority, scheduledDate,
            estimatedHours, cost, performedBy: performedBy || null,
            notes, createdBy: req.user.userId
        });

        return success(res, "Maintenance record created successfully", record);
    } catch (err) {
        return error(res, 500, "Failed to create maintenance record");
    }
};

// ── PUT /api/admin/maintenance/:id ────────────────────────────────────────────
export const updateMaintenance = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return error(res, 400, "Invalid maintenance record ID");

        const record = await MaintenanceHistory.findById(req.params.id);
        if (!record) return error(res, 404, "Maintenance record not found");

        const fields = ["type", "description", "status", "priority", "scheduledDate",
                        "completedDate", "estimatedHours", "actualHours", "cost", "performedBy", "notes"];
        fields.forEach(f => { if (req.body[f] !== undefined) record[f] = req.body[f]; });

        // Tự set completedDate khi status chuyển sang completed
        if (req.body.status === "completed" && !record.completedDate)
            record.completedDate = new Date();

        await record.save();
        return success(res, "Maintenance record updated successfully", record);
    } catch (err) {
        return error(res, 500, "Failed to update maintenance record");
    }
};

// ── DELETE /api/admin/maintenance/:id ─────────────────────────────────────────
export const deleteMaintenance = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return error(res, 400, "Invalid maintenance record ID");

        const record = await MaintenanceHistory.findByIdAndDelete(req.params.id);
        if (!record) return error(res, 404, "Maintenance record not found");

        return success(res, "Maintenance record deleted successfully");
    } catch (err) {
        return error(res, 500, "Failed to delete maintenance record");
    }
};
