import express from "express";
import {
    getIncidents, getIncidentById,
    createIncident, updateIncident, deleteIncident
} from "../../controllers/admin/incidentLog.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(protect, allowRoles(["admin", "super_admin"]));

router.get("/", getIncidents);
router.get("/:id", getIncidentById);
router.post("/", createIncident);
router.put("/:id", updateIncident);
router.delete("/:id", deleteIncident);

export default router;
