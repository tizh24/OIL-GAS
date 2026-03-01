import User from "../../models/user.model.js";
import { success, error } from "../../utils/response.js";
import bcrypt from "bcryptjs";

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

// Update user profile
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

// Change user password
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

