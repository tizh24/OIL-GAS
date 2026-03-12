import Equipment from "../../models/engineer/equipment.model.js";
import MaintenanceRecord from "../../models/engineer/maintenanceRecord.model.js";
import { success, error } from "../../utils/response.js";
import { logAudit } from "../../utils/audit.js";
import mongoose from "mongoose";

// GET /api/admin/equipment
export const getAllEquipment = async (req, res) => {
    try {
        const { page = 1, limit = 10, name, type, status, location } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const query = { deletedAt: null };
        if (name) query.$text = { $search: name };
        if (type) query.type = type;
        if (status) query.status = status;
        if (location) query.location = new RegExp(location, "i");

        const [equipment, total] = await Promise.all([
            Equipment.find(query)
                .populate("assignedTo createdBy", "name email")
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Equipment.countDocuments(query)
        ]);

        return success(res, "Equipment list retrieved successfully", {
            equipment,
            pagination: {
                page: pageNum, limit: limitNum, total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve equipment list", err.message);
    }
};

// GET /api/admin/equipment/:id
export const getEquipmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid equipment ID");

        const equipment = await Equipment.findOne({ _id: id, deletedAt: null })
            .populate("assignedTo createdBy updatedBy", "name email department")
            .populate("lastMaintenance.performedBy", "name email");

        if (!equipment) return error(res, 404, "Equipment not found");

        return success(res, "Equipment retrieved successfully", equipment);
    } catch (err) {
        return error(res, 500, "Failed to retrieve equipment", err.message);
    }
};

// POST /api/admin/equipment
export const createEquipment = async (req, res) => {
    try {
        const {
            name, type, serial, model, manufacturer, status,
            location, technicalSpecs, purchaseDate, warrantyExpiry,
            nextScheduledMaintenance, assignedTo
        } = req.body;

        if (!name || !type || !serial || !model || !manufacturer || !location) {
            return error(res, 400, "name, type, serial, model, manufacturer, location are required");
        }

        const existing = await Equipment.findOne({ serial });
        if (existing) return error(res, 400, "Equipment with this serial number already exists");

        const equipment = await Equipment.create({
            name, type, serial, model, manufacturer,
            status: status || "operational",
            location, technicalSpecs, purchaseDate, warrantyExpiry,
            nextScheduledMaintenance, assignedTo,
            createdBy: req.user.userId
        });

        await logAudit({
            action: "CREATE",
            entity: "Equipment",
            entityId: equipment._id,
            performedBy: req.user.userId,
            after: equipment.toObject(),
            req
        });

        return success(res, "Equipment created successfully", equipment);
    } catch (err) {
        return error(res, 500, "Failed to create equipment", err.message);
    }
};

// PUT /api/admin/equipment/:id
export const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid equipment ID");

        const equipment = await Equipment.findOne({ _id: id, deletedAt: null });
        if (!equipment) return error(res, 404, "Equipment not found");

        const before = equipment.toObject();

        const allowed = [
            "name", "type", "model", "manufacturer", "status", "location",
            "technicalSpecs", "purchaseDate", "warrantyExpiry",
            "nextScheduledMaintenance", "assignedTo", "lastMaintenance"
        ];

        allowed.forEach(field => {
            if (req.body[field] !== undefined) equipment[field] = req.body[field];
        });

        equipment.updatedBy = req.user.userId;
        await equipment.save();

        await logAudit({
            action: "UPDATE",
            entity: "Equipment",
            entityId: equipment._id,
            performedBy: req.user.userId,
            before,
            after: equipment.toObject(),
            req
        });

        return success(res, "Equipment updated successfully", equipment);
    } catch (err) {
        return error(res, 500, "Failed to update equipment", err.message);
    }
};

// DELETE /api/admin/equipment/:id  (soft delete — status -> out-of-service)
export const deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid equipment ID");

        const equipment = await Equipment.findOne({ _id: id, deletedAt: null });
        if (!equipment) return error(res, 404, "Equipment not found");

        // Block if operational or actively in maintenance
        if (["operational", "maintenance"].includes(equipment.status)) {
            return error(res, 400, `Cannot delete equipment with status '${equipment.status}'. Set status to 'out-of-service' first.`);
        }

        // Block if there are active/scheduled maintenance records
        const activeMaintenance = await MaintenanceRecord.findOne({
            equipment: id,
            status: { $in: ["scheduled", "in-progress"] },
            deletedAt: null
        });
        if (activeMaintenance) {
            return error(res, 400, "Cannot delete equipment with active or scheduled maintenance records.");
        }

        const before = equipment.toObject();
        await equipment.softDelete(req.user.userId);

        await logAudit({
            action: "DELETE",
            entity: "Equipment",
            entityId: equipment._id,
            performedBy: req.user.userId,
            before,
            reason: reason || null,
            req
        });

        return success(res, "Equipment deleted successfully");
    } catch (err) {
        return error(res, 500, "Failed to delete equipment", err.message);
    }
};

// GET /api/admin/equipment/:id/maintenance-history
export const getEquipmentMaintenanceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, status, type } = req.query;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid equipment ID");

        const equipment = await Equipment.findOne({ _id: id, deletedAt: null });
        if (!equipment) return error(res, 404, "Equipment not found");

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const query = { equipment: id, deletedAt: null };
        if (status) query.status = status;
        if (type) query.type = type;

        const [records, total] = await Promise.all([
            MaintenanceRecord.find(query)
                .populate("engineerId supervisorId", "name email department")
                .sort({ scheduledDate: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            MaintenanceRecord.countDocuments(query)
        ]);

        const stats = {
            total: await MaintenanceRecord.countDocuments({ equipment: id, deletedAt: null }),
            completed: await MaintenanceRecord.countDocuments({ equipment: id, status: "completed", deletedAt: null }),
            scheduled: await MaintenanceRecord.countDocuments({ equipment: id, status: "scheduled", deletedAt: null }),
            inProgress: await MaintenanceRecord.countDocuments({ equipment: id, status: "in-progress", deletedAt: null })
        };

        return success(res, "Equipment maintenance history retrieved", {
            equipment: { id: equipment._id, name: equipment.name, serial: equipment.serial, status: equipment.status },
            stats,
            records,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance history", err.message);
    }
};
