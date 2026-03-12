import express from "express";
import { getOilOutput, getDashboard } from "../../controllers/admin/monitoring.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(protect, allowRoles(["admin", "super_admin"]));

/**
 * @swagger
 * /api/admin/monitoring/oil-output:
 *   get:
 *     tags: [Admin Monitoring]
 *     summary: Get oil output monitoring data
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: Oil output data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: {type: boolean}
 *                 message: {type: string}
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp: {type: string}
 *                     production: {type: object}
 *                     flowRates: {type: object}
 *                     pressure: {type: object}
 */
router.get("/oil-output", getOilOutput);

/**
 * @swagger
 * /api/admin/monitoring/dashboard:
 *   get:
 *     tags: [Admin Monitoring]
 *     summary: Get monitoring dashboard data
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: Dashboard monitoring data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: {type: boolean}
 *                 message: {type: string}
 *                 data:
 *                   type: object
 */
router.get("/dashboard", getDashboard);

export default router;
