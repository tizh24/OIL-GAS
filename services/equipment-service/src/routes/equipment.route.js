import express from "express";
import {
    getAllEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipmentStats
} from "../controllers/equipment.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes accessible by all authenticated users
router.get("/", getAllEquipment);
router.get("/stats", requireRole(['admin', 'supervisor']), getEquipmentStats);
router.get("/:id", getEquipmentById);

// Routes for engineers and above
router.post("/", requireRole(['admin', 'supervisor', 'engineer']), createEquipment);
router.put("/:id", requireRole(['admin', 'supervisor', 'engineer']), updateEquipment);

// Admin only routes
router.delete("/:id", requireRole(['admin']), deleteEquipment);

export default router;
