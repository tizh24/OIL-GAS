import express from "express";
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    restoreUser,
    getUserStats
} from "../controllers/user.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (accessible by all authenticated users)
router.get("/me", (req, res) => {
    // Get current user info (will be handled by auth service)
    res.status(200).json({
        success: true,
        message: "Current user info should be handled by auth service",
        user: req.user
    });
});

// Admin and supervisor routes
router.get("/", requireRole(['admin', 'supervisor']), getAllUsers);
router.get("/stats", requireRole(['admin', 'supervisor']), getUserStats);
router.get("/:id", requireRole(['admin', 'supervisor']), getUserById);

// Admin only routes
router.put("/:id", requireRole(['admin']), updateUser);
router.delete("/:id", requireRole(['admin']), deleteUser);
router.post("/:id/restore", requireRole(['admin']), restoreUser);

export default router;
