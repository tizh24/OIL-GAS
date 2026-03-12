import express from "express";
import {
    getAllMaintenance,
    getMaintenanceById,
    getByTargetId,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance
} from "../../controllers/admin/maintenance.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createMaintenanceValidationSchema, updateMaintenanceValidationSchema } from "../../utils/validation.js";

const router = express.Router();

router.use(protect, allowRoles(["admin", "super_admin"]));

/**
 * @swagger
 * /api/admin/maintenance:
 *   get:
 *     tags: [Admin Maintenance]
 *     summary: Get all maintenance records
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: {type: string, enum: [preventive, corrective, predictive, emergency, inspection, calibration]}
 *       - in: query
 *         name: status
 *         schema: {type: string, enum: [scheduled, in-progress, completed, cancelled, delayed]}
 *       - in: query
 *         name: priority
 *         schema: {type: string, enum: [low, medium, high, critical]}
 *       - in: query
 *         name: engineerId
 *         schema: {type: string}
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *       - in: query
 *         name: limit
 *         schema: {type: integer, default: 10}
 *     responses:
 *       200:
 *         description: Maintenance records retrieved
 */
router.get("/", getAllMaintenance);

/**
 * @swagger
 * /api/admin/maintenance/target/{targetId}:
 *   get:
 *     tags: [Admin Maintenance]
 *     summary: Get maintenance records by equipment/instrument
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Maintenance records retrieved
 */
router.get("/target/:targetId", getByTargetId);

/**
 * @swagger
 * /api/admin/maintenance/{id}:
 *   get:
 *     tags: [Admin Maintenance]
 *     summary: Get maintenance record by ID
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Record retrieved
 */
router.get("/:id", getMaintenanceById);

/**
 * @swagger
 * /api/admin/maintenance:
 *   post:
 *     tags: [Admin Maintenance]
 *     summary: Create maintenance record
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [equipment, type, scheduledDate, engineerId, description]
 *             properties:
 *               equipment: {type: string}
 *               type: {type: string, enum: [preventive, corrective, predictive, emergency, inspection, calibration]}
 *               priority: {type: string, enum: [low, medium, high, critical]}
 *               scheduledDate: {type: string, format: date}
 *               estimatedHours: {type: number}
 *               engineerId: {type: string}
 *               supervisorId: {type: string}
 *               description: {type: string}
 *     responses:
 *       200:
 *         description: Record created
 */
router.post("/", validateRequest(createMaintenanceValidationSchema), createMaintenance);

/**
 * @swagger
 * /api/admin/maintenance/{id}:
 *   put:
 *     tags: [Admin Maintenance]
 *     summary: Update maintenance record
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Record updated
 */
router.put("/:id", validateRequest(updateMaintenanceValidationSchema), updateMaintenance);

/**
 * @swagger
 * /api/admin/maintenance/{id}:
 *   delete:
 *     tags: [Admin Maintenance]
 *     summary: Delete maintenance record
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Record deleted
 */
router.delete("/:id", allowRoles(["admin", "super_admin"]), deleteMaintenance);

export default router;
