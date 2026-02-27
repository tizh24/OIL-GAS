import User from "../models/user.model.js";
import { success, error } from "../utils/response.js";
import bcrypt from "bcryptjs";

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        return success(res, "Users retrieved successfully", users);
    } catch (err) {
        return error(res, 500, "Failed to retrieve users");
    }
};

export const createUser = async (req, res) => {
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

        // Remove password from response
        const { password: _, ...userResponse } = user.toObject();

        return success(res, "User created successfully", userResponse);
    } catch (err) {
        return error(res, 500, "Failed to create user");
    }
};
