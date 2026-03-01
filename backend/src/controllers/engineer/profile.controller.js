import User from "../../models/user.model.js";
import { success, error } from "../../utils/response.js";

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