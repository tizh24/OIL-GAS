import MaintenanceRecord from "../../models/engineer/maintenanceRecord.model.js";
import { success, error } from "../../utils/response.js";
import { logAudit } from "../../utils/audit.js";
import mongoose from "mongoose";

// GET /api/admin/maintenance
export const getAllMaintenance = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, status, priority, engineerId } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const query = { deletedAt: null };
        if (type) query.type = type;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (engineerId && mongoose.Types.ObjectId.isValid(engineerId)) query.engineerId = engineerId;

        const [records, total] = await Promise.all([
            MaintenanceRecord.find(query)
                .populate("equipment", "name type serial location")
                .populate("engineerId supervisorId", "name email department")
                .sort({ scheduledDate: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            MaintenanceRecord.countDocuments(query)
        ]);

        return success(res, "Maintenance records retrieved successfully", {
            records,
            pagination: {
                page: pageNum, limit: limitNum, total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance records", err.message);
    }
};

// GET /api/admin/maintenance/:id
export const getMaintenanceById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid record ID");

        const record = await MaintenanceRecord.findOne({ _id: id, deletedAt: null })
            .populate("equipment", "name type serial model location")
            .populate("engineerId supervisorId", "name email department");

        if (!record) return error(res, 404, "Maintenance record not found");
        return success(res, "Maintenance record retrieved successfully", record);
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance record", err.message);
    }
};

// GET /api/admin/maintenance/target/:targetId
export const getByTargetId = async (req, res) => {
    try {
        const { targetId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(targetId)) return error(res, 400, "Invalid target ID");

        const records = await MaintenanceRecord.find({
            equipment: targetId,
            deletedAt: null
        })
            .populate("engineerId supervisorId", "name email")
            .sort({ scheduledDate: -1 });

        return success(res, "Maintenance records retrieved successfully", records);
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance records", err.message);
    }
};

// POST /api/admin/maintenance
export const createMaintenance = async (req, res) => {
    return error(res, 403, "Admins are not allowed to create maintenance records. Use engineer endpoints.");
};

// PUT /api/admin/maintenance/:id
export const updateMaintenance = async (req, res) => {
    return error(res, 403, "Admins are not allowed to update maintenance records. Use engineer endpoints.");
};

// DELETE /api/admin/maintenance/:id  (soft delete)
export const deleteMaintenance = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid record ID");

        const record = await MaintenanceRecord.findOne({ _id: id, deletedAt: null });
        if (!record) return error(res, 404, "Maintenance record not found");

        // Cannot cancel a record that is already in progress
        if (record.status === "in-progress") {
            return error(res, 400, "Cannot delete a maintenance record that is currently in-progress. Complete or cancel it first.");
        }

        const before = record.toObject();
        await record.softDelete(req.user.userId);

        await logAudit({
            action: "DELETE",
            entity: "Maintenance",
            entityId: record._id,
            performedBy: req.user.userId,
            before,
            reason: reason || null,
            req
        });

        return success(res, "Maintenance record deleted successfully");
    } catch (err) {
        return error(res, 500, "Failed to delete maintenance record", err.message);
    }
};
