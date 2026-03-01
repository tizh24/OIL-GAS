import express from "express";
import { getProfile, updateProfile, changePassword } from "../../controllers/engineer/profile.controller.js";
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

/**
 * @swagger
 * /api/engineer/profile:
 *   put:
 *     tags:
 *       - Engineer
 *     summary: Update user profile
 *     description: Update current user's phone and department (cannot update role or status)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: "International phone format"
 *               department:
 *                 type: string
 *                 example: "Oil & Gas Engineering"
 *                 description: "User's department"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     department:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *       400:
 *         description: Invalid phone format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Account is inactive or deactivated
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update profile
 */
router.put("/profile", protect, updateProfile);

/**
 * @swagger
 * /api/engineer/profile/password:
 *   put:
 *     tags:
 *       - Engineer
 *     summary: Change user password
 *     description: Change current user's password with validation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "currentPassword123"
 *                 description: "Current password"
 *               newPassword:
 *                 type: string
 *                 example: "NewSecurePass123!"
 *                 description: "New password (min 8 chars, uppercase, lowercase, number, special char)"
 *               confirmPassword:
 *                 type: string
 *                 example: "NewSecurePass123!"
 *                 description: "Confirm new password"
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: "Password changed successfully"
 *       400:
 *         description: Validation errors (password mismatch, weak password, same as old password, etc.)
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Account is inactive or deactivated
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to change password
 */
router.put("/profile/password", protect, changePassword);

export default router;
