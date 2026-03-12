import express from "express";
import {
    getAuditLogs,
    getAuditLogById
} from "../../controllers/admin/auditLog.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(protect, allowRoles(["admin", "super_admin"]));

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin Audit Logs]
 *     summary: Get all audit logs with filters and pagination
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: {type: integer, default: 20, maximum: 100}
 *         description: Items per page
 *       - in: query
 *         name: entity
 *         schema: {type: string}
 *         description: Filter by entity (User, Equipment, Warehouse, etc.)
 *       - in: query
 *         name: action
 *         schema: {type: string}
 *         description: Filter by action (CREATE, UPDATE, DELETE, etc.)
 *       - in: query
 *         name: performedBy
 *         schema: {type: string}
 *         description: Filter by user ID who performed the action
 *       - in: query
 *         name: from
 *         schema: {type: string, format: date-time}
 *         description: Filter logs from this date
 *       - in: query
 *         name: to
 *         schema: {type: string, format: date-time}
 *         description: Filter logs to this date
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: {type: string}
 *                           entity: {type: string}
 *                           entityId: {type: string}
 *                           action: {type: string}
 *                           performedBy: {type: object}
 *                           before: {type: object}
 *                           after: {type: object}
 *                           ipAddress: {type: string}
 *                           userAgent: {type: string}
 *                           createdAt: {type: string, format: date-time}
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: {type: integer}
 *                         page: {type: integer}
 *                         limit: {type: integer}
 *                         pages: {type: integer}
 *       500:
 *         description: Failed to retrieve audit logs
 */
router.get("/", getAuditLogs);

/**
 * @swagger
 * /api/admin/audit-logs/{id}:
 *   get:
 *     tags: [Admin Audit Logs]
 *     summary: Get a single audit log by ID
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
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
 *                     _id: {type: string}
 *                     entity: {type: string}
 *                     entityId: {type: string}
 *                     action: {type: string}
 *                     performedBy:
 *                       type: object
 *                       properties:
 *                         _id: {type: string}
 *                         name: {type: string}
 *                         email: {type: string}
 *                         role: {type: string}
 *                     before: {type: object}
 *                     after: {type: object}
 *                     ipAddress: {type: string}
 *                     userAgent: {type: string}
 *                     createdAt: {type: string, format: date-time}
 *       400:
 *         description: Invalid log ID
 *       404:
 *         description: Audit log not found
 *       500:
 *         description: Failed to retrieve audit log
 */
router.get("/:id", getAuditLogById);

export default router;
