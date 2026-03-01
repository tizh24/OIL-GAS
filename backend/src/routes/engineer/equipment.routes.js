import express from "express";
import {
    getEquipmentList,
    getEquipmentDetail,
    getEquipmentMaintenanceHistory
} from "../../controllers/engineer/equipment.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Equipment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         name:
 *           type: string
 *           example: "Drilling Pump #001"
 *         type:
 *           type: string
 *           enum: ["drilling", "pumping", "safety", "measurement", "transportation", "other"]
 *           example: "pumping"
 *         serial:
 *           type: string
 *           example: "DP001-2024"
 *         model:
 *           type: string
 *           example: "XPump Pro 3000"
 *         manufacturer:
 *           type: string
 *           example: "PumpTech Industries"
 *         status:
 *           type: string
 *           enum: ["operational", "maintenance", "out-of-service", "repair", "inspection"]
 *           example: "operational"
 *         location:
 *           type: string
 *           example: "Site A - Platform 1"
 *         technicalSpecs:
 *           type: object
 *           properties:
 *             capacity:
 *               type: string
 *               example: "500 GPM"
 *             powerRating:
 *               type: string
 *               example: "150 HP"
 *             operatingPressure:
 *               type: string
 *               example: "3000 PSI"
 *         lastMaintenance:
 *           type: object
 *           properties:
 *             date:
 *               type: string
 *               format: date
 *               example: "2024-02-15"
 *             type:
 *               type: string
 *               example: "preventive"
 *         createdAt:
 *           type: string
 *           format: date-time
 *     MaintenanceRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: ["preventive", "corrective", "predictive", "emergency", "inspection", "calibration"]
 *         status:
 *           type: string
 *           enum: ["scheduled", "in-progress", "completed", "cancelled", "delayed"]
 *         scheduledDate:
 *           type: string
 *           format: date
 *         engineerId:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         cost:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *         workPerformed:
 *           type: string
 */

/**
 * @swagger
 * /api/engineer/equipment:
 *   get:
 *     tags:
 *       - Engineer Equipment
 *     summary: Get equipment list
 *     description: Retrieve equipment list with filtering and pagination (view:equipment permission required)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by equipment name (text search)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ["drilling", "pumping", "safety", "measurement", "transportation", "other"]
 *         description: Filter by equipment type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["operational", "maintenance", "out-of-service", "repair", "inspection"]
 *         description: Filter by equipment status
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
 *         description: Page number (>= 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 10
 *         description: Items per page (<= 100)
 *     responses:
 *       200:
 *         description: Equipment list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Equipment list retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     equipment:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Equipment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       400:
 *         description: Invalid pagination parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Failed to retrieve equipment list
 */
router.get("/", protect, allowRoles('engineer', 'admin', 'supervisor'), getEquipmentList);

/**
 * @swagger
 * /api/engineer/equipment/{id}:
 *   get:
 *     tags:
 *       - Engineer Equipment
 *     summary: Get equipment detail
 *     description: Retrieve detailed information about specific equipment including technical specs and maintenance summary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID
 *     responses:
 *       200:
 *         description: Equipment detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Equipment detail retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     equipment:
 *                       $ref: '#/components/schemas/Equipment'
 *                     maintenanceSummary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalCost:
 *                             type: number
 *                     recentMaintenance:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MaintenanceRecord'
 *       400:
 *         description: Invalid equipment ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Failed to retrieve equipment detail
 */
router.get("/:id", protect, allowRoles('engineer', 'admin', 'supervisor'), getEquipmentDetail);

/**
 * @swagger
 * /api/engineer/equipment/{id}/maintenance-history:
 *   get:
 *     tags:
 *       - Engineer Equipment
 *     summary: Get equipment maintenance history
 *     description: Retrieve maintenance history for specific equipment with date filtering and statistics (read-only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Equipment maintenance history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Equipment maintenance history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     equipment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         type:
 *                           type: string
 *                         serial:
 *                           type: string
 *                         model:
 *                           type: string
 *                     maintenanceRecords:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MaintenanceRecord'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: integer
 *                         totalCost:
 *                           type: number
 *                         avgCost:
 *                           type: number
 *                         totalHours:
 *                           type: number
 *                         completedCount:
 *                           type: integer
 *                     pagination:
 *                       type: object
 *                     filters:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                         endDate:
 *                           type: string
 *       400:
 *         description: Invalid equipment ID or pagination parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Failed to retrieve maintenance history
 */
router.get("/:id/maintenance-history", protect, allowRoles('engineer', 'admin', 'supervisor'), getEquipmentMaintenanceHistory);

export default router;