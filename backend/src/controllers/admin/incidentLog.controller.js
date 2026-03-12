import IncidentLog from "../../models/admin/incidentLog.model.js";
import { success, error } from "../../utils/response.js";
import mongoose from "mongoose";

// ── GET /api/admin/incidents ──────────────────────────────────────────────────
export const getIncidents = async (req, res) => {
    try {
        const {
            page = 1, limit = 20, severity, status,
            reportedBy, warehouseId, equipmentId, instrumentId
        } = req.query;

        const filter = {};
        if (severity)     filter.severity     = severity;
        if (status)       filter.status       = status;
        if (reportedBy)   filter.reportedBy   = reportedBy;
        if (warehouseId)  filter.warehouseId  = warehouseId;
        if (equipmentId)  filter.equipmentId  = equipmentId;
        if (instrumentId) filter.instrumentId = instrumentId;

        const pageNum  = Math.max(1, Number(page));
        const limitNum = Math.min(100, Number(limit));
        const skip     = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            IncidentLog.find(filter)
                .populate("reportedBy assignedTo", "name email")
                .populate("warehouseId",  "code name")
                .populate("equipmentId",  "name serial")
                .populate("instrumentId", "name serial")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            IncidentLog.countDocuments(filter)
        ]);

        return success(res, "Incident logs retrieved successfully", {
            logs,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve incident logs");
    }
};

// ── GET /api/admin/incidents/:id ──────────────────────────────────────────────
export const getIncidentById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return error(res, 400, "Invalid incident ID");

        const log = await IncidentLog.findById(req.params.id)
            .populate("reportedBy assignedTo", "name email department")
            .populate("warehouseId",  "code name location")
            .populate("equipmentId",  "name serial type")
            .populate("instrumentId", "name serial type");

        if (!log) return error(res, 404, "Incident log not found");
        return success(res, "Incident log retrieved successfully", log);
    } catch (err) {
        return error(res, 500, "Failed to retrieve incident log");
    }
};

// ── POST /api/admin/incidents ─────────────────────────────────────────────────
export const createIncident = async (req, res) => {
    try {
        const {
            title, description, severity, status, assignedTo,
            warehouseId, equipmentId, instrumentId, resolution
        } = req.body;

        if (!title)       return error(res, 400, "Title is required");
        if (!description) return error(res, 400, "Description is required");
        if (!severity)    return error(res, 400, "Severity is required");

        const log = await IncidentLog.create({
            title, description, severity,
            status:       status     || "open",
            reportedBy:   req.user.userId,
            assignedTo:   assignedTo  || null,
            warehouseId:  warehouseId  || null,
            equipmentId:  equipmentId  || null,
            instrumentId: instrumentId || null,
            resolution:   resolution   || ""
        });

        return success(res, "Incident log created successfully", log);
    } catch (err) {
        return error(res, 500, "Failed to create incident log");
    }
};

// ── PUT /api/admin/incidents/:id ──────────────────────────────────────────────
export const updateIncident = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return error(res, 400, "Invalid incident ID");

        const log = await IncidentLog.findById(req.params.id);
        if (!log) return error(res, 404, "Incident log not found");

        const fields = ["title", "description", "severity", "status",
                        "assignedTo", "resolution", "resolvedAt"];
        fields.forEach(f => { if (req.body[f] !== undefined) log[f] = req.body[f]; });

        // Tự set resolvedAt khi status chuyển thành resolved/closed
        if (["resolved", "closed"].includes(req.body.status) && !log.resolvedAt)
            log.resolvedAt = new Date();

        await log.save();
        return success(res, "Incident log updated successfully", log);
    } catch (err) {
        return error(res, 500, "Failed to update incident log");
    }
};

// ── DELETE /api/admin/incidents/:id ──────────────────────────────────────────
export const deleteIncident = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return error(res, 400, "Invalid incident ID");

        const log = await IncidentLog.findByIdAndDelete(req.params.id);
        if (!log) return error(res, 404, "Incident log not found");

        return success(res, "Incident log deleted successfully");
    } catch (err) {
        return error(res, 500, "Failed to delete incident log");
    }
};
