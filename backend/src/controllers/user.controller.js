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

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return error(res, 400, "User already exists", {
                field: 'email',
                message: 'An account with this email already exists'
            });
        }

        // Hash password
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

        const { password: _, ...userResponse } = user.toObject();
        return success(res, "User created successfully", userResponse);
    } catch (err) {
        console.error("Create user error:", err);
        return error(res, 500, "Failed to create user", err.message);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { phone, department } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is active
        if (user.status !== 'active') {
            return error(res, 403, "Account is inactive");
        }

        if (user.deletedAt) {
            return error(res, 403, "Account is deactivated");
        }

        // Validate phone format if provided
        if (phone) {
            const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Basic international phone format
            if (!phoneRegex.test(phone)) {
                return error(res, 400, "Invalid phone format. Use international format (e.g., +1234567890)");
            }
            user.phone = phone;
        }

        // Update department if provided (policy check can be added here)
        if (department !== undefined) {
            user.department = department;
        }

        await user.save();

        return success(res, "Profile updated successfully", {
            id: user._id,
            userCode: user.userCode,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            phone: user.phone,
            department: user.department,
            updatedAt: user.updatedAt
        });
    } catch (err) {
        return error(res, 500, "Failed to update profile", err.message);
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Get current user
        const currentUser = await User.findById(id);
        if (!currentUser) {
            return error(res, 404, "User not found");
        }

        // If email is being updated, check for uniqueness
        if (updates.email && updates.email !== currentUser.email) {
            const existingUser = await User.findOne({
                email: updates.email,
                _id: { $ne: id }
            });
            if (existingUser) {
                return error(res, 400, "Email already in use", {
                    field: 'email',
                    message: 'This email address is already associated with another account'
                });
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                ...updates,
                updatedAt: new Date()
            },
            {
                new: true,
                select: '-password'
            }
        );

        return success(res, "User updated successfully", updatedUser);
    } catch (err) {
        console.error("Update user error:", err);
        return error(res, 500, "Failed to update user", err.message);
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');

        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is active
        if (user.status !== 'active') {
            return error(res, 403, "Account is inactive");
        }

        if (user.deletedAt) {
            return error(res, 403, "Account is deactivated");
        }

        return success(res, "User profile retrieved successfully", {
            id: user._id,
            userCode: user.userCode,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            phone: user.phone,
            department: user.department,
            createdAt: user.createdAt
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve user profile", err.message);
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

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!oldPassword || !newPassword || !confirmPassword) {
            return error(res, 400, "Old password, new password, and confirm password are required");
        }

        // Validate confirm password
        if (newPassword !== confirmPassword) {
            return error(res, 400, "New password and confirm password do not match");
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return error(res, 400, "Password must be at least 8 characters with uppercase, lowercase, number, and special character");
        }

        // Get user with password field
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is active
        if (user.status !== 'active') {
            return error(res, 403, "Account is inactive");
        }

        if (user.deletedAt) {
            return error(res, 403, "Account is deactivated");
        }

        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return error(res, 400, "Old password is incorrect");
        }

        // Check if new password is different from old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return error(res, 400, "New password must be different from the current password");
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;
        await user.save();

        return success(res, "Password changed successfully");
    } catch (err) {
        return error(res, 500, "Failed to change password", err.message);
    }
};
