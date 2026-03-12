import Incident from "../../models/engineer/incident.model.js";
import { success, error } from "../../utils/response.js";
import { logAudit } from "../../utils/audit.js";
import mongoose from "mongoose";

// GET /api/admin/incidents
export const getAllIncidents = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, severity, status, instrumentId } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const query = { deletedAt: null };
        if (type) query.type = type;
        if (severity) query.severity = severity;
        if (status) query.status = status;
        if (instrumentId && mongoose.Types.ObjectId.isValid(instrumentId)) {
            query.instrumentId = instrumentId;
        }

        const [incidents, total] = await Promise.all([
            Incident.find(query)
                .populate("instrumentId", "name type serial location")
                .populate("reportedBy", "name email department")
                .sort({ incidentDate: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Incident.countDocuments(query)
        ]);

        return success(res, "Incidents retrieved successfully", {
            incidents,
            pagination: {
                page: pageNum, limit: limitNum, total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve incidents", err.message);
    }
};

// GET /api/admin/incidents/:id
export const getIncidentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid incident ID");

        const incident = await Incident.findOne({ _id: id, deletedAt: null })
            .populate("instrumentId", "name type serial model location")
            .populate("reportedBy", "name email department");

        if (!incident) return error(res, 404, "Incident not found");
        return success(res, "Incident retrieved successfully", incident);
    } catch (err) {
        return error(res, 500, "Failed to retrieve incident", err.message);
    }
};

// POST /api/admin/incidents
export const createIncident = async (req, res) => {
    try {
        const { instrumentId, type, severity, description, actionsTaken, incidentDate } = req.body;

        if (!instrumentId || !type || !severity || !description) {
            return error(res, 400, "instrumentId, type, severity, description are required");
        }
        if (!mongoose.Types.ObjectId.isValid(instrumentId)) {
            return error(res, 400, "Invalid instrument ID");
        }

        const incident = await Incident.create({
            instrumentId,
            type,
            severity,
            description,
            actionsTaken: actionsTaken || null,
            incidentDate: incidentDate || new Date(),
            reportedBy: req.user.userId,
            status: "open"
        });

        await logAudit({
            action: "CREATE",
            entity: "Incident",
            entityId: incident._id,
            performedBy: req.user.userId,
            after: incident.toObject(),
            req
        });

        return success(res, "Incident created successfully", incident);
    } catch (err) {
        return error(res, 500, "Failed to create incident", err.message);
    }
};

// PUT /api/admin/incidents/:id
export const updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid incident ID");

        const incident = await Incident.findOne({ _id: id, deletedAt: null });
        if (!incident) return error(res, 404, "Incident not found");

        const before = incident.toObject();

        const allowed = [
            "type", "severity", "status", "description",
            "actionsTaken", "incidentDate", "resolvedAt"
        ];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) incident[field] = req.body[field];
        });

        // Auto-set resolvedAt when status transitions to resolved/closed
        if (
            (incident.status === "resolved" || incident.status === "closed") &&
            !incident.resolvedAt
        ) {
            incident.resolvedAt = new Date();
        }

        await incident.save();

        await logAudit({
            action: "UPDATE",
            entity: "Incident",
            entityId: incident._id,
            performedBy: req.user.userId,
            before,
            after: incident.toObject(),
            req
        });

        return success(res, "Incident updated successfully", incident);
    } catch (err) {
        return error(res, 500, "Failed to update incident", err.message);
    }
};

// DELETE /api/admin/incidents/:id  (soft delete — SRS: no hard deletes for data integrity)
export const deleteIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid incident ID");

        const incident = await Incident.findOne({ _id: id, deletedAt: null });
        if (!incident) return error(res, 404, "Incident not found");

        // Prevent deletion of open critical incidents — must be resolved first
        if (incident.status === "open" && incident.severity === "critical") {
            return error(
                res, 400,
                "Cannot delete an open critical incident. Resolve or close it first."
            );
        }

        const before = incident.toObject();

        incident.deletedAt = new Date();
        incident.deletedBy = req.user.userId;
        await incident.save();

        await logAudit({
            action: "DELETE",
            entity: "Incident",
            entityId: incident._id,
            performedBy: req.user.userId,
            before,
            after: incident.toObject(),   // captures deletedAt / deletedBy
            reason: reason || null,
            req
        });

        return success(res, "Incident deleted successfully");
    } catch (err) {
        return error(res, 500, "Failed to delete incident", err.message);
    }
};
