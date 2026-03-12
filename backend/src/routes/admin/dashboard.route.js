import express from "express";
import {
    getOilOutput,
    getDashboardStats
} from "../../controllers/admin/dashboard.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(protect, allowRoles(["admin", "super_admin"]));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin Dashboard]
 *     summary: Get general dashboard statistics
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: Dashboard stats (equipment, instruments, maintenance, incidents counts)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: {type: boolean}
 *                 data:
 *                   type: object
 *                   properties:
 *                     equipment:
 *                       type: object
 *                       properties:
 *                         total: {type: integer}
 *                         operational: {type: integer}
 *                         nonOperational: {type: integer}
 *                     instruments:
 *                       type: object
 *                     maintenance:
 *                       type: object
 *                     incidents:
 *                       type: object
 */
router.get("/", getDashboardStats);

/**
 * @swagger
 * /api/admin/dashboard/oil-output:
 *   get:
 *     tags: [Admin Dashboard]
 *     summary: Get oil output data from instruments
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema: {type: integer, minimum: 1, maximum: 168, default: 24}
 *         description: Past hours window (1–168)
 *       - in: query
 *         name: wellId
 *         schema: {type: string}
 *         description: Filter by well ID
 *       - in: query
 *         name: instrumentId
 *         schema: {type: string}
 *         description: Filter by instrument ID
 *     responses:
 *       200:
 *         description: Oil output readings retrieved
 */
router.get("/oil-output", getOilOutput);

export default router;
