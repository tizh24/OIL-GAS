import jwt from "jsonwebtoken";
import { error as errorResponse } from "../utils/response.js";
import { allowRoles } from "./role.middleware.js";

export const protect = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return errorResponse(res, 401, "No token");

    try {
        const token = auth.split(" ")[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return errorResponse(res, 401, "Invalid token");
    }
};

// Alias for consistency across the application
export const authenticateToken = protect;

// Delegate role-based middleware to centralized allowRoles
export const requireRole = (allowedRoles) => {
    return allowRoles(allowedRoles);
};

export const requireRoles = (allowedRoles) => {
    return allowRoles(allowedRoles);
};
