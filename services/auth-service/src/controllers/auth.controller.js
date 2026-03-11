import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import bcrypt from "bcryptjs";
import {
    generateAccessToken,
    generateRefreshToken
} from "../utils/token.js";
import { success, error } from "../utils/response.js";

export const register = async (req, res) => {
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

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        await RefreshToken.create({
            user: user._id,
            token: refreshToken,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        });

        return success(res, "User registered successfully", {
            user: {
                id: user._id,
                userCode: user.userCode,
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone,
                department: user.department,
                status: user.status,
                createdAt: user.createdAt
            },
            accessToken,
            refreshToken
        });
    } catch (err) {
        console.error("Registration error:", err);
        return error(res, 500, "Registration failed", err.message);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and explicitly select password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return error(res, 401, "Invalid credentials", {
                message: 'Email or password is incorrect'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return error(res, 401, "Invalid credentials", {
                message: 'Email or password is incorrect'
            });
        }

        // Check if user is soft deleted
        if (user.deletedAt) {
            return error(res, 401, "Account is deactivated");
        }

        // Check user status
        if (user.status === 'inactive') {
            return error(res, 401, "Account is inactive");
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        await RefreshToken.create({
            user: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        return success(res, "Login successful", {
            user: {
                id: user._id,
                userCode: user.userCode,
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone,
                department: user.department,
                status: user.status,
                createdAt: user.createdAt
            },
            accessToken,
            refreshToken
        });
    } catch (err) {
        console.error("Login error:", err);
        return error(res, 500, "Login failed", err.message);
    }
};

export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return error(res, 400, "Refresh token is required");
        }

        const stored = await RefreshToken.findOne({ token: refreshToken });
        if (!stored) {
            return error(res, 401, "Invalid refresh token");
        }

        if (stored.expiresAt < Date.now()) {
            // Clean up expired token
            await RefreshToken.deleteOne({ token: refreshToken });
            return error(res, 401, "Refresh token expired");
        }

        const user = await User.findById(stored.user);
        if (!user) {
            return error(res, 401, "User not found");
        }

        const accessToken = generateAccessToken(user);

        return success(res, "Token refreshed", {
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        return error(res, 500, "Token refresh failed");
    }
};

export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return error(res, 400, "Refresh token is required");
        }

        // Delete the refresh token from database
        const deleted = await RefreshToken.deleteOne({ token: refreshToken });

        if (deleted.deletedCount === 0) {
            return error(res, 404, "Refresh token not found");
        }

        return success(res, "Logged out successfully");
    } catch (err) {
        return error(res, 500, "Logout failed");
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        // Get user with password field
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return error(res, 404, "User not found");
        }

        // Check if user is active
        if (user.status !== 'active' || user.deletedAt) {
            return error(res, 401, "Account is not active");
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return error(res, 400, "Current password is incorrect", {
                field: 'currentPassword',
                message: 'The current password you entered is incorrect'
            });
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return error(res, 400, "New password must be different from current password", {
                field: 'newPassword',
                message: 'Please choose a different password'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await User.findByIdAndUpdate(userId, {
            password: hashedNewPassword,
            updatedAt: new Date()
        });

        // Invalidate all existing refresh tokens for security
        await RefreshToken.deleteMany({ user: userId });

        return success(res, "Password changed successfully", {
            message: 'Your password has been updated. Please log in again with your new password.'
        });
    } catch (err) {
        console.error("Change password error:", err);
        return error(res, 500, "Failed to change password", err.message);
    }
};

export const verifyToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return error(res, 404, "User not found");
        }

        return success(res, "Token is valid", {
            user: {
                id: user._id,
                userCode: user.userCode,
                email: user.email,
                role: user.role,
                name: user.name,
                department: user.department,
                status: user.status
            }
        });
    } catch (err) {
        return error(res, 500, "Token verification failed");
    }
};
