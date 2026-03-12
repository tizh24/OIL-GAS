import express from "express";
import {
    getMaintenanceHistory, getMaintenanceById,
    createMaintenance, updateMaintenance, deleteMaintenance
} from "../../controllers/admin/maintenanceHistory.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(protect, allowRoles(["admin", "super_admin"]));

router.get("/", getMaintenanceHistory);
router.get("/:id", getMaintenanceById);

// Remove create/update/delete for admin per policy (engineers create records)

export default router;
