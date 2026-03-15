import Equipment from "../../models/engineer/equipment.model.js";
import Instrument from "../../models/engineer/instrument.model.js";
import Incident, { Alert } from "../../models/engineer/incident.model.js";
import MaintenanceRecord from "../../models/engineer/maintenanceRecord.model.js";
import SensorData from "../../models/engineer/sensorData.model.js";
import OilOutput from "../../models/engineer/oilOutput.model.js";
import Report from "../../models/engineer/report.model.js";
import { success, error } from "../../utils/response.js";

// Equipment
export const getEquipmentList = async (req, res) => {
    try {
        const { status, location, page = 1, limit = 10, search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) return error(res, 400, "Page must be >= 1");
        if (limitNum > 100) return error(res, 400, "Limit must be <= 100");

        const filters = {};
        if (status) filters.status = status;
        if (location) filters.location = location;
        if (search) filters.name = search;

        const equipment = await Equipment.findWithFilters(filters, { page: pageNum, limit: limitNum });

        const query = { deletedAt: null };
        if (status) query.status = status;
        if (location) query.location = new RegExp(location, 'i');
        if (search) query.$text = { $search: search };

        const totalCount = await Equipment.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Equipment list retrieved successfully", {
            equipment,
            pagination
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve equipment list", err.message);
    }
};

export const getEquipmentDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const equipment = await Equipment.findOne({ _id: id, deletedAt: null })
            .populate('assignedTo createdBy updatedBy', 'name email')
            .populate('lastMaintenance.performedBy', 'name email');

        if (!equipment) return error(res, 404, "Equipment not found");

        // Optionally include related data counts
        const instrumentCount = await Instrument.countDocuments({ deletedAt: null, equipmentId: id });
        const activeAlerts = await Alert.countDocuments({ deletedAt: null, 'source.equipment': id, acknowledged: false });

        return success(res, "Equipment detail retrieved successfully", {
            equipment: {
                id: equipment._id,
                name: equipment.name,
                type: equipment.type,
                location: equipment.location,
                status: equipment.status,
                manufacturer: equipment.manufacturer,
                installationDate: equipment.purchaseDate || null,
                description: equipment.technicalSpecs || null,
                instruments: [], // client can fetch /instruments?equipmentId=...
                maintenanceHistory: [],
                alerts: []
            },
            optional: { instrumentCount, activeAlerts }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve equipment detail", err.message);
    }
};

// Instruments
export const getInstrumentsList = async (req, res) => {
    try {
        const { equipmentId, type, status, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) return error(res, 400, "Page must be >= 1");
        if (limitNum > 100) return error(res, 400, "Limit must be <= 100");

        const filters = {};
        if (equipmentId) filters.location = equipmentId;
        if (type) filters.type = type;
        if (status) filters.status = status;

        const instruments = await Instrument.findWithFilters(filters, { page: pageNum, limit: limitNum });

        const query = { deletedAt: null };
        if (type) query.type = type;
        if (status) query.status = status;
        if (equipmentId) query.equipmentId = equipmentId;

        const totalCount = await Instrument.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Instruments retrieved successfully", { instruments, pagination });
    } catch (err) {
        return error(res, 500, "Failed to retrieve instruments", err.message);
    }
};

export const getInstrumentDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const instrument = await Instrument.findOne({ _id: id, deletedAt: null })
            .populate('assignedEngineers.engineer', 'name email')
            .populate('lastMaintenance.performedBy', 'name email');

        if (!instrument) return error(res, 404, "Instrument not found");

        return success(res, "Instrument detail retrieved successfully", {
            id: instrument._id,
            name: instrument.name,
            type: instrument.type,
            equipmentId: instrument.equipmentId || null,
            status: instrument.status,
            unit: instrument.operationalParameters && instrument.operationalParameters.currentReading ? instrument.operationalParameters.currentReading.unit : null,
            lastCalibrationDate: instrument.operationalParameters && instrument.operationalParameters.calibrationDate ? instrument.operationalParameters.calibrationDate : instrument.lastMaintenance && instrument.lastMaintenance.date,
            maintenanceInterval: instrument.operationalParameters && instrument.operationalParameters.nextCalibrationDate ? null : null,
            createdAt: instrument.createdAt,
            sensorData: [],
            maintenanceRecords: []
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve instrument detail", err.message);
    }
};

// Alerts
export const getAlertsList = async (req, res) => {
    try {
        const { severity, status, equipmentId, fromDate, toDate, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) return error(res, 400, "Page must be >= 1");
        if (limitNum > 100) return error(res, 400, "Limit must be <= 100");

        const filters = {};
        if (severity) filters.severity = severity;
        if (equipmentId) filters['source.equipment'] = equipmentId;
        if (fromDate) filters.startDate = fromDate;
        if (toDate) filters.endDate = toDate;

        const alerts = await Alert.findWithFilters(filters, { page: pageNum, limit: limitNum });

        const query = { deletedAt: null };
        if (severity) query.severity = severity;
        if (equipmentId) query['source.equipment'] = equipmentId;
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        const totalCount = await Alert.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Alerts retrieved successfully", { alerts, pagination });
    } catch (err) {
        return error(res, 500, "Failed to retrieve alerts", err.message);
    }
};

export const getAlertDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await Alert.findOne({ _id: id, deletedAt: null });
        if (!alert) return error(res, 404, "Alert not found");

        return success(res, "Alert retrieved successfully", alert);
    } catch (err) {
        return error(res, 500, "Failed to retrieve alert", err.message);
    }
};

// Incidents
export const getIncidentsList = async (req, res) => {
    try {
        const { severity, status, equipmentId, assignedEngineer, fromDate, toDate, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) return error(res, 400, "Page must be >= 1");
        if (limitNum > 100) return error(res, 400, "Limit must be <= 100");

        const filters = {};
        if (severity) filters.severity = severity;
        if (status) filters.status = status;
        if (equipmentId) filters.equipment = equipmentId;
        if (assignedEngineer) filters.assignedTo = assignedEngineer;
        if (fromDate) filters.startDate = fromDate;
        if (toDate) filters.endDate = toDate;

        const incidents = await Incident.findWithFilters(filters, { page: pageNum, limit: limitNum });

        const query = { deletedAt: null };
        if (severity) query.severity = severity;
        if (status) query.status = status;
        if (equipmentId) query.equipment = equipmentId;
        if (assignedEngineer) query.assignedTo = assignedEngineer;
        if (fromDate || toDate) {
            query.reportedAt = {};
            if (fromDate) query.reportedAt.$gte = new Date(fromDate);
            if (toDate) query.reportedAt.$lte = new Date(toDate);
        }

        const totalCount = await Incident.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Incidents retrieved successfully", { incidents, pagination });
    } catch (err) {
        return error(res, 500, "Failed to retrieve incidents", err.message);
    }
};

export const getIncidentDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const incident = await Incident.findOne({ _id: id, deletedAt: null })
            .populate('reportedBy assignedTo equipment instrument');

        if (!incident) return error(res, 404, "Incident not found");

        return success(res, "Incident retrieved successfully", incident);
    } catch (err) {
        return error(res, 500, "Failed to retrieve incident", err.message);
    }
};

export const assignEngineerToIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { engineerId } = req.body;

        if (!engineerId) return error(res, 400, "engineerId is required");

        const incident = await Incident.findOne({ _id: id, deletedAt: null });
        if (!incident) return error(res, 404, "Incident not found");

        incident.assignedTo = engineerId;
        incident.status = 'investigating'; // map IN_PROGRESS to investigating used in engineer model
        await incident.save();

        const populated = await Incident.findById(id).populate('assignedTo', 'name email');

        return success(res, "Engineer assigned successfully", populated);
    } catch (err) {
        return error(res, 500, "Failed to assign engineer", err.message);
    }
};

// Maintenance
export const getMaintenanceRecords = async (req, res) => {
    try {
        const { equipmentId, engineerId, fromDate, toDate, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) return error(res, 400, "Page must be >= 1");
        if (limitNum > 100) return error(res, 400, "Limit must be <= 100");

        const query = { deletedAt: null };
        if (equipmentId) query.equipment = equipmentId;
        if (engineerId) query.engineerId = engineerId;
        if (fromDate || toDate) {
            query.scheduledDate = {};
            if (fromDate) query.scheduledDate.$gte = new Date(fromDate);
            if (toDate) query.scheduledDate.$lte = new Date(toDate);
        }

        const records = await MaintenanceRecord.find(query)
            .populate('engineerId supervisorId', 'name email')
            .sort({ scheduledDate: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const totalCount = await MaintenanceRecord.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Maintenance records retrieved successfully", { records, pagination });
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance records", err.message);
    }
};

export const getMaintenanceDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await MaintenanceRecord.findOne({ _id: id, deletedAt: null }).populate('engineerId supervisorId', 'name email');
        if (!record) return error(res, 404, "Maintenance record not found");
        return success(res, "Maintenance record retrieved successfully", record);
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance record", err.message);
    }
};

// Sensor Data
export const getSensorData = async (req, res) => {
    try {
        const { instrumentId, from, to, page = 1, limit = 100 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(1000, parseInt(limit) || 100);

        if (pageNum < 1) return error(res, 400, "Page must be >= 1");
        if (limitNum > 1000) return error(res, 400, "Limit must be <= 1000");

        const query = {};
        if (instrumentId) query.sensorId = instrumentId;
        if (from || to) query.timestamp = {};
        if (from) query.timestamp.$gte = new Date(from);
        if (to) query.timestamp.$lte = new Date(to);

        const data = await SensorData.find(query)
            .sort({ timestamp: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const totalCount = await SensorData.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Sensor data retrieved successfully", { data, pagination });
    } catch (err) {
        return error(res, 500, "Failed to retrieve sensor data", err.message);
    }
};

export const getRealtimeSensorData = async (req, res) => {
    try {
        const { equipmentId } = req.query;
        const query = {};
        if (equipmentId) query.equipmentId = equipmentId;

        // Return latest reading per instrument (simple approach: last N readings)
        const data = await SensorData.find(query).sort({ timestamp: -1 }).limit(100);
        return success(res, "Realtime sensor data retrieved successfully", data.map(d => ({ instrumentId: d.sensorId, value: d.value, unit: d.unit, timestamp: d.timestamp })));
    } catch (err) {
        return error(res, 500, "Failed to retrieve realtime data", err.message);
    }
};

// Oil Output
export const getOilOutput = async (req, res) => {
    try {
        const { wellId, fromDate, toDate, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) return error(res, 400, "Page must be >= 1");
        if (limitNum > 100) return error(res, 400, "Limit must be <= 100");

        const query = { deletedAt: null };
        if (wellId) query.wellId = wellId;
        if (fromDate || toDate) {
            query.recordedAt = {};
            if (fromDate) query.recordedAt.$gte = new Date(fromDate);
            if (toDate) query.recordedAt.$lte = new Date(toDate);
        }

        const records = await OilOutput.find(query).sort({ recordedAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum);
        const totalCount = await OilOutput.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Oil output retrieved successfully", { records, pagination });
    } catch (err) {
        return error(res, 500, "Failed to retrieve oil output", err.message);
    }
};

// Reports
export const generateReport = async (req, res) => {
    try {
        const { type, fromDate, toDate, format } = req.body;
        if (!type) return error(res, 400, "type is required");

        const report = await Report.create({ type, generatedBy: req.user.userId, fromDate, toDate, status: 'pending', format: format || 'pdf' });

        return success(res, "Report generation requested", report);
    } catch (err) {
        return error(res, 500, "Failed to generate report", err.message);
    }
};

export default {
    getEquipmentList,
    getEquipmentDetail,
    getInstrumentsList,
    getInstrumentDetail,
    getAlertsList,
    getAlertDetail,
    getIncidentsList,
    getIncidentDetail,
    assignEngineerToIncident,
    getMaintenanceRecords,
    getMaintenanceDetail,
    getSensorData,
    getRealtimeSensorData,
    getOilOutput,
    generateReport
};
