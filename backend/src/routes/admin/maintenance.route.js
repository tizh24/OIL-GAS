import express from "express";
import {
    getAllMaintenance,
    getMaintenanceById,
    getByTargetId,
    deleteMaintenance
} from "../../controllers/admin/maintenance.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = express.Router();

// Admin routes: read-only and management of maintenance records (no create by admin)
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
 * /api/admin/maintenance:
 *   post:
 *     tags: [Admin Maintenance]
 *     summary: Create maintenance record (DEPRECATED - Admins not allowed)
 *     description: "Deprecated. Maintenance creation is restricted to Engineers. Admins should NOT call this endpoint. Use POST /api/engineer/instruments/{id}/maintenance with Engineer role instead."
 *     security: [{bearerAuth: []}]
 *     responses:
 *       403:
 *         description: Forbidden - Admins are not allowed to create maintenance records
 */

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
 * /api/admin/maintenance/{id}:
 *   put:
 *     tags: [Admin Maintenance]
 *     summary: Update maintenance record (DEPRECATED - Admins not allowed)
 *     description: "Deprecated. Maintenance updates are performed via Engineer workflows. Admins should not modify maintenance records."
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       403:
 *         description: Forbidden - Admins are not allowed to update maintenance records
 */

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
