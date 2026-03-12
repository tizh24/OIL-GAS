import { error as errorResponse } from "../utils/response.js";

export const allowRoles = (...roles) => {
    // Support both allowRoles('admin','engineer') and allowRoles(['admin','engineer'])
    if (roles.length === 1 && Array.isArray(roles[0])) {
        roles = roles[0];
    }

    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 401, "Authentication required");
        }

        if (!roles.includes(req.user.role)) {
            return errorResponse(res, 403, "Forbidden");
        }
        next();
    };
};
