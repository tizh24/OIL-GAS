import Equipment from "../models/equipment.model.js";
import { success, error } from "../utils/response.js";

export const getAllEquipment = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            type,
            status,
            location,
            includeDeleted = false
        } = req.query;

        // Build filter object
        const filter = {};

        if (!includeDeleted) {
            filter.deletedAt = null;
        }

        if (search) {
            filter.$text = { $search: search };
        }

        if (type) filter.type = type;
        if (status) filter.status = status;
        if (location) filter.location = new RegExp(location, 'i');

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const equipment = await Equipment.find(filter)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Equipment.countDocuments(filter);

        return success(res, "Equipment retrieved successfully", {
            equipment,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (err) {
        console.error("Get equipment error:", err);
        return error(res, 500, "Failed to retrieve equipment", err.message);
    }
};

export const getEquipmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const equipment = await Equipment.findById(id).select('-__v');
        if (!equipment) {
            return error(res, 404, "Equipment not found");
        }

        // Check if equipment is soft deleted
        if (equipment.deletedAt && req.user.role !== 'admin') {
            return error(res, 404, "Equipment not found");
        }

        return success(res, "Equipment retrieved successfully", { equipment });
    } catch (err) {
        console.error("Get equipment error:", err);
        return error(res, 500, "Failed to retrieve equipment", err.message);
    }
};

export const createEquipment = async (req, res) => {
    try {
        const {
            name, type, serial, model, manufacturer, location,
            technicalSpecs, purchaseDate, warrantyExpiry,
            assignedTo, nextScheduledMaintenance
        } = req.body;

        // Check if serial number already exists
        const existingEquipment = await Equipment.findOne({ serial });
        if (existingEquipment) {
            return error(res, 400, "Equipment with this serial number already exists");
        }

        const equipment = await Equipment.create({
            name,
            type,
            serial,
            model,
            manufacturer,
            location,
            technicalSpecs,
            purchaseDate,
            warrantyExpiry,
            assignedTo,
            nextScheduledMaintenance,
            createdBy: req.user.userId,
            status: 'operational'
        });

        return success(res, "Equipment created successfully", { equipment });
    } catch (err) {
        console.error("Create equipment error:", err);
        return error(res, 500, "Failed to create equipment", err.message);
    }
};

export const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        updateData.updatedBy = req.user.userId;

        // Check if equipment exists
        const equipment = await Equipment.findById(id);
        if (!equipment) {
            return error(res, 404, "Equipment not found");
        }

        // Check if equipment is soft deleted
        if (equipment.deletedAt) {
            return error(res, 400, "Cannot update deleted equipment");
        }

        // Check for duplicate serial if updating
        if (updateData.serial && updateData.serial !== equipment.serial) {
            const existingEquipment = await Equipment.findOne({ serial: updateData.serial });
            if (existingEquipment) {
                return error(res, 400, "Equipment with this serial number already exists");
            }
        }

        const updatedEquipment = await Equipment.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        return success(res, "Equipment updated successfully", { equipment: updatedEquipment });
    } catch (err) {
        console.error("Update equipment error:", err);
        return error(res, 500, "Failed to update equipment", err.message);
    }
};

export const deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;

        const equipment = await Equipment.findById(id);
        if (!equipment) {
            return error(res, 404, "Equipment not found");
        }

        // Check if equipment is already deleted
        if (equipment.deletedAt) {
            return error(res, 400, "Equipment is already deleted");
        }

        // Perform soft delete
        await equipment.softDelete(req.user.userId);

        return success(res, "Equipment deleted successfully");
    } catch (err) {
        console.error("Delete equipment error:", err);
        return error(res, 500, "Failed to delete equipment", err.message);
    }
};

export const getEquipmentStats = async (req, res) => {
    try {
        const stats = await Equipment.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: null,
                    totalEquipment: { $sum: 1 },
                    operationalCount: {
                        $sum: { $cond: [{ $eq: ["$status", "operational"] }, 1, 0] }
                    },
                    maintenanceCount: {
                        $sum: { $cond: [{ $eq: ["$status", "maintenance"] }, 1, 0] }
                    },
                    outOfServiceCount: {
                        $sum: { $cond: [{ $eq: ["$status", "out-of-service"] }, 1, 0] }
                    }
                }
            }
        ]);

        const typeStats = await Equipment.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]);

        return success(res, "Equipment statistics retrieved successfully", {
            overview: stats[0] || { totalEquipment: 0, operationalCount: 0, maintenanceCount: 0, outOfServiceCount: 0 },
            typeDistribution: typeStats
        });
    } catch (err) {
        console.error("Get equipment stats error:", err);
        return error(res, 500, "Failed to retrieve equipment statistics", err.message);
    }
};
