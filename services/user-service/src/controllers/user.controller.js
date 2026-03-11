import User from "../models/user.model.js";
import { success, error } from "../utils/response.js";

export const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            status,
            department,
            includeDeleted = false
        } = req.query;

        // Build filter object
        const filter = {};

        if (!includeDeleted) {
            filter.deletedAt = null;
        }

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { userCode: new RegExp(search, 'i') }
            ];
        }

        if (role) filter.role = role;
        if (status) filter.status = status;
        if (department) filter.department = new RegExp(department, 'i');

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const users = await User.find(filter)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        return success(res, "Users retrieved successfully", {
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (err) {
        console.error("Get users error:", err);
        return error(res, 500, "Failed to retrieve users", err.message);
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-__v');
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is soft deleted
        if (user.deletedAt && req.user.role !== 'admin') {
            return error(res, 404, "User not found");
        }

        return success(res, "User retrieved successfully", { user });
    } catch (err) {
        console.error("Get user error:", err);
        return error(res, 500, "Failed to retrieve user", err.message);
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, department, role, status } = req.body;

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is soft deleted
        if (user.deletedAt) {
            return error(res, 400, "Cannot update deleted user");
        }

        // Build update object
        const updateData = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (department !== undefined) updateData.department = department;

        // Only admin can update role and status
        if (req.user.role === 'admin') {
            if (role) updateData.role = role;
            if (status) updateData.status = status;
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        return success(res, "User updated successfully", { user: updatedUser });
    } catch (err) {
        console.error("Update user error:", err);
        return error(res, 500, "Failed to update user", err.message);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is already deleted
        if (user.deletedAt) {
            return error(res, 400, "User is already deleted");
        }

        // Perform soft delete
        await user.softDelete(req.user.userId);

        return success(res, "User deleted successfully");
    } catch (err) {
        console.error("Delete user error:", err);
        return error(res, 500, "Failed to delete user", err.message);
    }
};

export const restoreUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is not deleted
        if (!user.deletedAt) {
            return error(res, 400, "User is not deleted");
        }

        // Restore user
        user.deletedAt = null;
        user.deletedBy = null;
        user.status = 'active';
        await user.save();

        return success(res, "User restored successfully", { user });
    } catch (err) {
        console.error("Restore user error:", err);
        return error(res, 500, "Failed to restore user", err.message);
    }
};

export const getUserStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                    },
                    deletedUsers: {
                        $sum: { $cond: [{ $ne: ["$deletedAt", null] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalUsers: 1,
                    activeUsers: 1,
                    inactiveUsers: { $subtract: ["$totalUsers", "$activeUsers"] },
                    deletedUsers: 1
                }
            }
        ]);

        const roleStats = await User.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            }
        ]);

        return success(res, "User statistics retrieved successfully", {
            overview: stats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0, deletedUsers: 0 },
            roleDistribution: roleStats
        });
    } catch (err) {
        console.error("Get user stats error:", err);
        return error(res, 500, "Failed to retrieve user statistics", err.message);
    }
};
