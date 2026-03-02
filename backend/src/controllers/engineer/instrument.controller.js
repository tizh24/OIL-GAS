import Instrument from "../../models/engineer/instrument.model.js";
import MaintenanceRecord from "../../models/engineer/maintenanceRecord.model.js";
import { success, error } from "../../utils/response.js";

// Get instrument list with filters and pagination
export const getInstrumentList = async (req, res) => {
    try {
        const { name, type, status, location, page = 1, limit = 10 } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) {
            return error(res, 400, "Page must be >= 1");
        }

        if (limitNum > 100) {
            return error(res, 400, "Limit must be <= 100");
        }

        // Build filter object
        const filters = {};
        if (name) filters.name = name;
        if (type) filters.type = type;
        if (status) filters.status = status;
        if (location) filters.location = location;

        // Get instruments with filters and pagination
        const instruments = await Instrument.findWithFilters(filters, {
            page: pageNum,
            limit: limitNum
        });

        // Get total count for pagination
        const query = { deletedAt: null };
        if (name) query.$text = { $search: name };
        if (type) query.type = type;
        if (status) query.status = status;
        if (location) query.location = new RegExp(location, 'i');

        const totalCount = await Instrument.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Instrument list retrieved successfully", {
            instruments,
            pagination
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve instrument list", err.message);
    }
};

// Get instrument detail by ID
export const getInstrumentDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate numeric ID
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
            return error(res, 400, "Invalid instrument ID");
        }

        // Find instrument and check if not deleted
        const instrument = await Instrument.findOne({
            _id: numericId,
            deletedAt: null
        })
            .populate('assignedEngineers.engineer', 'name email department role')
            .populate('createdBy updatedBy', 'name email department')
            .populate('lastMaintenance.performedBy', 'name email');

        if (!instrument) {
            return error(res, 404, "Instrument not found");
        }        // Get maintenance summary
        const maintenanceSummary = await MaintenanceRecord.aggregate([
            {
                $match: {
                    equipment: numericId,
                    deletedAt: null
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalCost: { $sum: "$cost.total" }
                }
            }
        ]);

        // Get recent maintenance records
        const recentMaintenance = await MaintenanceRecord.find({
            equipment: id,
            deletedAt: null
        })
            .populate('engineerId', 'name email department')
            .sort({ scheduledDate: -1 })
            .limit(5);

        return success(res, "Instrument detail retrieved successfully", {
            instrument,
            maintenanceSummary,
            recentMaintenance
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve instrument detail", err.message);
    }
};

// Get instrument info for 3D simulator
export const getInstrumentInfo = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate numeric ID
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
            return error(res, 400, "Invalid instrument ID");
        }

        // Find instrument with specific fields for 3D simulator
        const instrument = await Instrument.findOne({
            _id: numericId,
            deletedAt: null
        }, {
            name: 1,
            type: 1,
            model: 1,
            specifications: 1,
            operationalParameters: 1,
            model3D: 1,
            status: 1,
            location: 1
        });

        if (!instrument) {
            return error(res, 404, "Instrument not found");
        }

        return success(res, "Instrument info retrieved successfully", instrument);
    } catch (err) {
        return error(res, 500, "Failed to retrieve instrument info", err.message);
    }
};

// Create maintenance schedule for instrument
export const scheduleInstrumentMaintenance = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, description, startDate, estimatedHours, priority = "medium" } = req.body;

        // Validate numeric ID
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
            return error(res, 400, "Invalid instrument ID");
        }

        // Validate required fields
        if (!type || !description || !startDate) {
            return error(res, 400, "Type, description, and start date are required");
        }

        // Validate type enum
        const validTypes = ["preventive", "corrective", "predictive", "emergency", "inspection", "calibration"];
        if (!validTypes.includes(type)) {
            return error(res, 400, `Type must be one of: ${validTypes.join(", ")}`);
        }

        // Validate start date
        const scheduledDate = new Date(startDate);
        const now = new Date();

        if (scheduledDate > now) {
            // Only validate future dates for non-emergency maintenance
            if (type !== "emergency" && scheduledDate < new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
                return error(res, 400, "Start date must be at least 24 hours in the future for non-emergency maintenance");
            }
        }        // Check if instrument exists and not deleted
        const instrument = await Instrument.findOne({
            _id: numericId,
            deletedAt: null
        });

        if (!instrument) {
            return error(res, 404, "Instrument not found");
        }        // Check if there's already scheduled maintenance
        const existingMaintenance = await MaintenanceRecord.findOne({
            equipment: numericId,
            scheduledDate: {
                $gte: new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
                $lte: new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
            },
            status: { $in: ["scheduled", "in-progress"] },
            deletedAt: null
        });

        if (existingMaintenance) {
            return error(res, 409, "Maintenance already scheduled within 2 hours of this time");
        }

        // Create maintenance record
        const maintenanceRecord = await MaintenanceRecord.create({
            equipment: numericId,
            type,
            description,
            scheduledDate,
            estimatedHours: estimatedHours || 4,
            priority,
            engineerId: req.user.userId,
            status: "scheduled",
            createdBy: req.user.userId
        });

        // Update instrument's last maintenance info
        instrument.lastMaintenance = {
            date: null, // Will be updated when maintenance is completed
            type: type,
            performedBy: req.user.userId,
            notes: `Maintenance scheduled: ${description}`,
            nextDue: scheduledDate
        };

        await instrument.save();

        // Populate the created record
        const populatedRecord = await MaintenanceRecord.findById(maintenanceRecord._id)
            .populate('engineerId', 'name email department')
            .populate('equipment', 'name type serial model location');

        // TODO: Add audit log here
        // auditLog.create({
        //     action: 'CREATE_MAINTENANCE_SCHEDULE',
        //     resourceType: 'MaintenanceRecord',
        //     resourceId: maintenanceRecord._id,
        //     userId: req.user.userId,
        //     details: { instrumentId: id, type, scheduledDate }
        // });

        return success(res, "Maintenance scheduled successfully", populatedRecord);
    } catch (err) {
        return error(res, 500, "Failed to schedule maintenance", err.message);
    }
};