import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "No token" });

    try {
        const token = auth.split(" ")[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
};

// Alias for consistency across the application
export const authenticateToken = protect;

// Role-based access control middleware
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Insufficient permissions."
            });
        }

        next();
    };
};

// Multiple roles support (alias for requireRole for clarity)
export const requireRoles = (allowedRoles) => {
    return requireRole(allowedRoles);
};
