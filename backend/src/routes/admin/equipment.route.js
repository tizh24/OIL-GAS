import express from "express";
import {
    getAllEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipmentMaintenanceHistory
} from "../../controllers/admin/equipment.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import {
    createEquipmentValidationSchema,
    updateEquipmentValidationSchema
} from "../../utils/validation.js";

const router = express.Router();

// Apply authentication and role-based access to all routes
router.use(protect);
router.use(allowRoles(["admin", "super_admin"]));

/**
 * @swagger
 * /api/admin/equipment:
 *   get:
 *     tags: [Admin Equipment]
 *     summary: Get all equipment (Admin)
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *       - in: query
 *         name: limit
 *         schema: {type: integer, default: 10}
 *       - in: query
 *         name: name
 *         schema: {type: string}
 *       - in: query
 *         name: type
 *         schema: {type: string}
 *       - in: query
 *         name: status
 *         schema: {type: string}
 *       - in: query
 *         name: location
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Equipment list retrieved successfully
 */
router.get("/", getAllEquipment);

/**
 * @swagger
 * /api/admin/equipment/{id}:
 *   get:
 *     tags: [Admin Equipment]
 *     summary: Get equipment by ID (Admin)
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Equipment retrieved successfully
 *       404:
 *         description: Equipment not found
 */
router.get("/:id", getEquipmentById);

/**
 * @swagger
 * /api/admin/equipment:
 *   post:
 *     tags: [Admin Equipment]
 *     summary: Create new equipment (Admin)
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, serial, model, manufacturer, location]
 *             properties:
 *               name: {type: string}
 *               type: {type: string}
 *               serial: {type: string}
 *               model: {type: string}
 *               manufacturer: {type: string}
 *               location: {type: string}
 *               status: {type: string, enum: [operational, maintenance, repair, decommissioned]}
 *     responses:
 *       201:
 *         description: Equipment created successfully
 */
router.post("/", validateRequest(createEquipmentValidationSchema), createEquipment);

/**
 * @swagger
 * /api/admin/equipment/{id}:
 *   put:
 *     tags: [Admin Equipment]
 *     summary: Update equipment (Admin)
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: {type: string}
 *               type: {type: string}
 *               status: {type: string}
 *               location: {type: string}
 *     responses:
 *       200:
 *         description: Equipment updated successfully
 */
router.put("/:id", validateRequest(updateEquipmentValidationSchema), updateEquipment);

/**
 * @swagger
 * /api/admin/equipment/{id}:
 *   delete:
 *     tags: [Admin Equipment]
 *     summary: Delete equipment (Admin)
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Equipment deleted successfully
 */
router.delete("/:id", deleteEquipment);

/**
 * @swagger
 * /api/admin/equipment/{id}/maintenance-history:
 *   get:
 *     tags: [Admin Equipment]
 *     summary: Get equipment maintenance history (Admin)
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Maintenance history retrieved successfully
 */
router.get("/:id/maintenance-history", getEquipmentMaintenanceHistory);

export default router;
