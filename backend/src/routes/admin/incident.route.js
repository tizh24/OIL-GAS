import express from "express";
import {
    getAllIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident
} from "../../controllers/admin/incident.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import {
    createIncidentValidationSchema,
    updateIncidentValidationSchema
} from "../../utils/validation.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles(["admin", "super_admin"]));

/**
 * @swagger
 * /api/admin/incidents:
 *   get:
 *     tags: [Admin Incidents]
 *     summary: Get all incidents
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: {type: string, enum: [leak, breakdown, malfunction, accident, near-miss, fire, spill, other]}
 *       - in: query
 *         name: severity
 *         schema: {type: string, enum: [low, medium, high, critical]}
 *       - in: query
 *         name: status
 *         schema: {type: string, enum: [open, in-progress, resolved, closed]}
 *       - in: query
 *         name: instrumentId
 *         schema: {type: string}
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *       - in: query
 *         name: limit
 *         schema: {type: integer, default: 10}
 *     responses:
 *       200:
 *         description: Incidents retrieved
 */
router.get("/", getAllIncidents);

/**
 * @swagger
 * /api/admin/incidents/{id}:
 *   get:
 *     tags: [Admin Incidents]
 *     summary: Get incident by ID
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Incident retrieved
 *       404:
 *         description: Incident not found
 */
router.get("/:id", getIncidentById);

/**
 * @swagger
 * /api/admin/incidents:
 *   post:
 *     tags: [Admin Incidents]
 *     summary: Create a new incident
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [instrumentId, type, severity, description]
 *             properties:
 *               instrumentId: {type: string}
 *               type:
 *                 type: string
 *                 enum: [leak, breakdown, malfunction, accident, near-miss, fire, spill, other]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               description: {type: string}
 *               actionsTaken: {type: string}
 *               incidentDate: {type: string, format: date-time}
 *     responses:
 *       201:
 *         description: Incident created
 */
router.post("/", validateRequest(createIncidentValidationSchema), createIncident);

/**
 * @swagger
 * /api/admin/incidents/{id}:
 *   put:
 *     tags: [Admin Incidents]
 *     summary: Update an incident
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
 *               type:
 *                 type: string
 *                 enum: [leak, breakdown, malfunction, accident, near-miss, fire, spill, other]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, resolved, closed]
 *               description: {type: string}
 *               actionsTaken: {type: string}
 *               resolvedAt: {type: string, format: date-time}
 *     responses:
 *       200:
 *         description: Incident updated
 *       404:
 *         description: Incident not found
 */
router.put("/:id", validateRequest(updateIncidentValidationSchema), updateIncident);

/**
 * @swagger
 * /api/admin/incidents/{id}:
 *   delete:
 *     tags: [Admin Incidents]
 *     summary: Soft-delete an incident
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: {type: string}
 *     responses:
 *       200:
 *         description: Incident deleted
 *       404:
 *         description: Incident not found
 */
router.delete("/:id", deleteIncident);

export default router;
