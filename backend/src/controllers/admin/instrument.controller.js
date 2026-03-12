import Instrument from "../../models/engineer/instrument.model.js";
import MaintenanceRecord from "../../models/engineer/maintenanceRecord.model.js";
import { success, error } from "../../utils/response.js";
import { logAudit } from "../../utils/audit.js";
import mongoose from "mongoose";

// GET /api/admin/instruments
export const getAllInstruments = async (req, res) => {
    try {
        const { page = 1, limit = 10, name, type, status, location } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const query = { deletedAt: null };
        if (name) query.$text = { $search: name };
        if (type) query.type = type;
        if (status) query.status = status;
        if (location) query.location = new RegExp(location, "i");

        const [instruments, total] = await Promise.all([
            Instrument.find(query)
                .populate("assignedEngineers.engineer", "name email department")
                .populate("createdBy", "name email")
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Instrument.countDocuments(query)
        ]);

        return success(res, "Instruments retrieved successfully", {
            instruments,
            pagination: {
                page: pageNum, limit: limitNum, total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve instruments", err.message);
    }
};

// GET /api/admin/instruments/:id
export const getInstrumentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid instrument ID");

        const instrument = await Instrument.findOne({ _id: id, deletedAt: null })
            .populate("assignedEngineers.engineer", "name email department role")
            .populate("createdBy updatedBy", "name email")
            .populate("lastMaintenance.performedBy", "name email");

        if (!instrument) return error(res, 404, "Instrument not found");
        return success(res, "Instrument retrieved successfully", instrument);
    } catch (err) {
        return error(res, 500, "Failed to retrieve instrument", err.message);
    }
};

// POST /api/admin/instruments
export const createInstrument = async (req, res) => {
    try {
        const {
            name, type, serial, model, manufacturer, status, location,
            specifications, operationalParameters, installationDate, warrantyExpiry
        } = req.body;

        if (!name || !type || !serial || !model || !manufacturer || !location) {
            return error(res, 400, "name, type, serial, model, manufacturer, location are required");
        }

        const existing = await Instrument.findOne({ serial });
        if (existing) return error(res, 400, "Instrument with this serial number already exists");

        const instrument = await Instrument.create({
            name, type, serial, model, manufacturer,
            status: status || "operational",
            location, specifications, operationalParameters,
            installationDate, warrantyExpiry,
            createdBy: req.user.userId
        });

        await logAudit({
            action:      "CREATE",
            entity:      "Instrument",
            entityId:    instrument._id,
            performedBy: req.user.userId,
            after:       instrument.toObject(),
            req
        });

        return success(res, "Instrument created successfully", instrument);
    } catch (err) {
        return error(res, 500, "Failed to create instrument", err.message);
    }
};

// PUT /api/admin/instruments/:id
export const updateInstrument = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid instrument ID");

        const instrument = await Instrument.findOne({ _id: id, deletedAt: null });
        if (!instrument) return error(res, 404, "Instrument not found");

        const before = instrument.toObject();

        const allowed = [
            "name", "type", "model", "manufacturer", "status", "location",
            "specifications", "operationalParameters", "installationDate",
            "warrantyExpiry", "lastMaintenance"
        ];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) instrument[field] = req.body[field];
        });

        instrument.updatedBy = req.user.userId;
        await instrument.save();

        await logAudit({
            action:      "UPDATE",
            entity:      "Instrument",
            entityId:    instrument._id,
            performedBy: req.user.userId,
            before,
            after:       instrument.toObject(),
            req
        });

        return success(res, "Instrument updated successfully", instrument);
    } catch (err) {
        return error(res, 500, "Failed to update instrument", err.message);
    }
};

// DELETE /api/admin/instruments/:id  (soft delete)
export const deleteInstrument = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid instrument ID");

        const instrument = await Instrument.findOne({ _id: id, deletedAt: null });
        if (!instrument) return error(res, 404, "Instrument not found");

        if (instrument.status === "operational" || instrument.status === "maintenance") {
            return error(res, 400, `Cannot delete an instrument with status '${instrument.status}'. Change status to 'faulty', 'calibration', or 'out-of-service' first.`);
        }

        // Block deletion if there are active/pending maintenance records
        const activeMaintenance = await MaintenanceRecord.findOne({
            equipment: id,
            status:    { $in: ["scheduled", "in-progress"] },
            deletedAt: null
        });
        if (activeMaintenance) {
            return error(res, 400, "Cannot delete instrument with active or scheduled maintenance records.");
        }

        const before = instrument.toObject();
        await instrument.softDelete(req.user.userId);

        await logAudit({
            action:      "DELETE",
            entity:      "Instrument",
            entityId:    instrument._id,
            performedBy: req.user.userId,
            before,
            reason:      reason || null,
            req
        });

        return success(res, "Instrument deactivated successfully");
    } catch (err) {
        return error(res, 500, "Failed to delete instrument", err.message);
    }
};

// POST /api/admin/instruments/:id/engineers
export const assignEngineer = async (req, res) => {
    try {
        const { id } = req.params;
        // Accept 'assignmentRole' (SRS field name) with 'role' as legacy fallback
        const { engineerId, assignmentRole, role } = req.body;
        const resolvedRole = assignmentRole || role || "primary";

        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid instrument ID");
        if (!engineerId) return error(res, 400, "engineerId is required");
        if (!mongoose.Types.ObjectId.isValid(engineerId)) return error(res, 400, "Invalid engineerId");

        const instrument = await Instrument.findOne({ _id: id, deletedAt: null });
        if (!instrument) return error(res, 404, "Instrument not found");

        const alreadyAssigned = instrument.assignedEngineers.some(
            a => a.engineer.toString() === engineerId
        );
        if (alreadyAssigned) return error(res, 400, "Engineer is already assigned to this instrument");

        instrument.assignedEngineers.push({
            engineer:       engineerId,
            assignmentRole: resolvedRole,
            role:           resolvedRole,
            assignedAt:     new Date()
        });
        instrument.updatedBy = req.user.userId;
        await instrument.save();
        await instrument.populate("assignedEngineers.engineer", "name email department");

        await logAudit({
            action:      "ASSIGN_ENGINEER",
            entity:      "Instrument",
            entityId:    instrument._id,
            performedBy: req.user.userId,
            after:       { engineerId, assignmentRole: resolvedRole },
            req
        });

        return success(res, "Engineer assigned successfully", instrument);
    } catch (err) {
        return error(res, 500, "Failed to assign engineer", err.message);
    }
};

// DELETE /api/admin/instruments/:id/engineers/:engineerId
export const removeEngineer = async (req, res) => {
    try {
        const { id, engineerId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid instrument ID");
        if (!mongoose.Types.ObjectId.isValid(engineerId)) return error(res, 400, "Invalid engineer ID");

        const instrument = await Instrument.findOne({ _id: id, deletedAt: null });
        if (!instrument) return error(res, 404, "Instrument not found");

        // Capture full before snapshot — not just a count
        const before = instrument.toObject();

        const prevLength = instrument.assignedEngineers.length;
        instrument.assignedEngineers = instrument.assignedEngineers.filter(
            a => a.engineer.toString() !== engineerId
        );
        if (instrument.assignedEngineers.length === prevLength) {
            return error(res, 404, "Engineer not found on this instrument");
        }

        instrument.updatedBy = req.user.userId;
        await instrument.save();

        await logAudit({
            action:      "REMOVE_ENGINEER",
            entity:      "Instrument",
            entityId:    instrument._id,
            performedBy: req.user.userId,
            before,                         // full snapshot before removal
            after:       instrument.toObject(), // full snapshot after removal
            req
        });

        return success(res, "Engineer removed successfully", instrument);
    } catch (err) {
        return error(res, 500, "Failed to remove engineer", err.message);
    }
};
