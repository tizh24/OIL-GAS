import Equipment from "../../models/engineer/equipment.model.js";
import MaintenanceRecord from "../../models/engineer/maintenanceRecord.model.js";
import { success, error } from "../../utils/response.js";

// Get equipment list with filters and pagination
export const getEquipmentList = async (req, res) => {
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

        // Get equipment with filters and pagination
        const equipment = await Equipment.findWithFilters(filters, {
            page: pageNum,
            limit: limitNum
        });

        // Get total count for pagination
        const query = { deletedAt: null };
        if (name) query.$text = { $search: name };
        if (type) query.type = type;
        if (status) query.status = status;
        if (location) query.location = new RegExp(location, 'i');

        const totalCount = await Equipment.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

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

// Get equipment detail by ID
export const getEquipmentDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate numeric ID
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
            return error(res, 400, "Invalid equipment ID");
        }

        // Find equipment and check if not deleted
        const equipment = await Equipment.findOne({
            _id: numericId,
            deletedAt: null
        })
            .populate('assignedTo createdBy updatedBy', 'name email department')
            .populate('lastMaintenance.performedBy', 'name email');

        if (!equipment) {
            return error(res, 404, "Equipment not found");
        }

        // Get maintenance summary (optional)
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
            .populate('engineerId', 'name email')
            .sort({ scheduledDate: -1 })
            .limit(5);

        return success(res, "Equipment detail retrieved successfully", {
            equipment,
            maintenanceSummary,
            recentMaintenance
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve equipment detail", err.message);
    }
};

// Get equipment maintenance history
export const getEquipmentMaintenanceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, page = 1, limit = 20 } = req.query;

        // Validate numeric ID
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
            return error(res, 400, "Invalid equipment ID");
        }

        // Check if equipment exists and not deleted
        const equipment = await Equipment.findOne({
            _id: numericId,
            deletedAt: null
        });

        if (!equipment) {
            return error(res, 404, "Equipment not found");
        }

        // Validate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) {
            return error(res, 400, "Page must be >= 1");
        }

        if (limitNum > 100) {
            return error(res, 400, "Limit must be <= 100");
        }

        // Build filter options
        const filterOptions = {};
        if (startDate) filterOptions.startDate = startDate;
        if (endDate) filterOptions.endDate = endDate;        // Get maintenance history
        const maintenanceRecords = await MaintenanceRecord.findByEquipment(numericId, filterOptions)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        // Get total count
        const query = { equipment: numericId, deletedAt: null };
        if (startDate || endDate) {
            query.scheduledDate = {};
            if (startDate) query.scheduledDate.$gte = new Date(startDate);
            if (endDate) query.scheduledDate.$lte = new Date(endDate);
        }

        const totalCount = await MaintenanceRecord.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

        // Get maintenance statistics
        const maintenanceStats = await MaintenanceRecord.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    totalCost: { $sum: "$cost.total" },
                    avgCost: { $avg: "$cost.total" },
                    totalHours: { $sum: "$actualHours" },
                    completedCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const stats = maintenanceStats[0] || {
            totalRecords: 0,
            totalCost: 0,
            avgCost: 0,
            totalHours: 0,
            completedCount: 0
        };

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Equipment maintenance history retrieved successfully", {
            equipment: {
                id: equipment._id,
                name: equipment.name,
                type: equipment.type,
                serial: equipment.serial,
                model: equipment.model
            },
            maintenanceRecords,
            statistics: stats,
            pagination,
            filters: {
                startDate,
                endDate
            }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve maintenance history", err.message);
    }
};