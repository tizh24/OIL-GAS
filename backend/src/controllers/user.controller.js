import User from "../models/user.model.js";
import { success, error } from "../utils/response.js";
import bcrypt from "bcryptjs";

export const getUsers = async (req, res) => {
    try {
        const { includeDeleted } = req.query;

        let query = {
            status: 'active'  // Chỉ lấy users có status active
        };

        // Include or exclude deleted users
        if (includeDeleted !== 'true') {
            query.deletedAt = null; // Only non-deleted users
        }

        const users = await User.find(query)
            .select('-password')
            .populate('deletedBy', 'name email userCode');

        return success(res, "Users retrieved successfully", users);
    } catch (err) {
        console.error("Get users error:", err);
        return error(res, 500, "Failed to retrieve users", err.message);
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { includeDeleted } = req.query;

        let query = {};

        // Include or exclude deleted users
        if (includeDeleted !== 'true') {
            query.deletedAt = null; // Only non-deleted users
        }

        const users = await User.find(query)
            .select('-password')
            .populate('deletedBy', 'name email userCode');

        return success(res, "All users retrieved successfully", users);
    } catch (err) {
        console.error("Get all users error:", err);
        return error(res, 500, "Failed to retrieve all users", err.message);
    }
};

export const createUser = async (req, res) => {
    try {
        const { email, password, role, name, phone, department } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return error(res, 400, "User already exists");
        }

        if (!name) {
            return error(res, 400, "Name is required");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            password: hashedPassword,
            role: role || 'engineer',
            name,
            phone,
            department,
            status: 'active'
        });

        const { password: _, ...userResponse } = user.toObject(); return success(res, "User created successfully", userResponse);
    } catch (err) {
        return error(res, 500, "Failed to create user");
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedByUserId = req.user.userId; // From auth middleware

        // Find user by ID
        const user = await User.findById(id);
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is already soft deleted
        if (user.deletedAt) {
            return error(res, 400, "User is already deleted");
        }

        // Perform soft delete
        await user.softDelete(deletedByUserId);

        return success(res, "User deleted successfully", {
            userCode: user.userCode,
            email: user.email,
            name: user.name,
            status: user.status,
            deletedAt: user.deletedAt
        });
    } catch (err) {
        console.error("Delete user error:", err);
        return error(res, 500, "Failed to delete user", err.message);
    }
};

export const restoreUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Find user by ID including soft deleted ones
        const user = await User.findById(id);
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is actually deleted
        if (!user.deletedAt) {
            return error(res, 400, "User is not deleted");
        }

        // Restore user
        user.deletedAt = null;
        user.deletedBy = null;
        user.status = 'active';
        await user.save();

        const { password: _, ...userResponse } = user.toObject(); return success(res, "User restored successfully", userResponse);
    } catch (err) {
        console.error("Restore user error:", err);
        return error(res, 500, "Failed to restore user", err.message);
    }
};

export const getDeletedUsers = async (req, res) => {
    try {
        const deletedUsers = await User.findDeleted()
            .select('-password')
            .populate('deletedBy', 'name email userCode');

        return success(res, "Deleted users retrieved successfully", deletedUsers);
    } catch (err) {
        console.error("Get deleted users error:", err);
        return error(res, 500, "Failed to retrieve deleted users", err.message);
    }
};
