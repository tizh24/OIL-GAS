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
            return error(res, 400, "User already exists");
        }

        // Validate required fields
        if (!name) {
            return error(res, 400, "Name is required");
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
        return error(res, 500, "Registration failed");
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return error(res, 400, "Email and password are required");
        }

        // Explicitly select password field (might be excluded by default)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return error(res, 401, "Invalid credentials");
        }

        const ok = await bcrypt.compare(password, user.password);

        if (!ok) {
            return error(res, 401, "Invalid credentials");
        }

        // Check if user is soft deleted
        if (user.deletedAt) {
            return error(res, 401, "Account is deactivated");
        }        // Check user status
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
