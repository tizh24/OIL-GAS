import express from "express";
import { getProfile } from "../../controllers/engineer/profile.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/engineer/profile:
 *   get:
 *     tags:
 *       - Engineer
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's own profile information (no role check needed)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                   example: "User profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "user@example.com"
 *                     name:
 *                       type: string
 *                       example: "John Engineer"
 *                     role:
 *                       type: string
 *                       enum: ["admin", "engineer", "supervisor"]
 *                       example: "engineer"
 *                     status:
 *                       type: string
 *                       enum: ["active", "inactive"]
 *                       example: "active"
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     department:
 *                       type: string
 *                       example: "Oil & Gas Engineering"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T00:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Account is inactive or deactivated
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve user profile
 */
router.get("/profile", protect, getProfile);

export default router;
