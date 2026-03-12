import express from "express";
import {
    getInstrumentList,
    getInstrumentDetail,
    getInstrumentInfo,
    scheduleInstrumentMaintenance
} from "../../controllers/engineer/instrument.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/engineer/instruments:
 *   get:
 *     tags:
 *       - Engineer Instruments
 *     summary: Get instrument list with filters
 *     description: Retrieve a list of instruments with optional filtering by name, type, status, and location
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by instrument name (text search)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by instrument type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [operational, maintenance, faulty, decommissioned]
 *         description: Filter by instrument status
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (partial match)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of instruments per page (max 100)
 *     responses:
 *       200:
 *         description: Instrument list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     instruments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           location:
 *                             type: string
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
router.get("/", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getInstrumentList);

/**
 * @swagger
 * /api/engineer/instruments/{id}:
 *   get:
 *     tags:
 *       - Engineer Instruments
 *     summary: Get detailed instrument information by ID
 *     description: Retrieve comprehensive details of a specific instrument
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *     responses:
 *       200:
 *         description: Instrument detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get("/:id", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getInstrumentDetail);

/**
 * @swagger
 * /api/engineer/instruments/{id}/info:
 *   get:
 *     tags:
 *       - Engineer Instruments
 *     summary: Get instrument information for 3D simulator
 *     description: Retrieve specific instrument data optimized for 3D simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *     responses:
 *       200:
 *         description: Instrument info retrieved successfully for 3D simulator
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get("/:id/info", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getInstrumentInfo);

/**
 * @swagger
 * /api/engineer/instruments/{id}/maintenance:
 *   post:
 *     tags:
 *       - Engineer Instruments
 *     summary: Schedule maintenance for an instrument (Engineer only)
 *     description: Create a new maintenance schedule for a specific instrument. Requires Engineer role (bearer token with role=engineer).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [preventive, corrective, predictive, emergency, inspection, calibration]
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               estimatedHours:
 *                 type: number
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *             required: [type, description, startDate]
 *     responses:
 *       200:
 *         description: Maintenance scheduled successfully
 *       403:
 *         description: Forbidden - Engineer role required
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 *       409:
 *         description: Conflict - Maintenance already scheduled
 *       500:
 *         description: Internal Server Error
 */
router.post("/:id/maintenance", authenticateToken, requireRole(["engineer"]), scheduleInstrumentMaintenance);

export default router;
