import express from "express";
import { getUsers, createUser } from "../controllers/user.controller.js";
import { getProfile } from "../controllers/engineer/profile.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           example: "John Engineer"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         department:
 *           type: string
 *           example: "Oil & Gas Engineering"
 *         status:
 *           type: string
 *           enum: ["active", "inactive"]
 *           example: "active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00Z"
 *         role:
 *           type: string
 *           enum: ["admin", "engineer", "supervisor"]
 *           example: "engineer"
 *     CreateUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "newuser@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "securepassword123"
 *         name:
 *           type: string
 *           example: "John Engineer"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         department:
 *           type: string
 *           example: "Oil & Gas Engineering"
 *         role:
 *           type: string
 *           enum: [admin, engineer, supervisor]
 *           default: engineer
 *           example: "engineer"
 *     UsersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Users retrieved successfully"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "User created successfully"
 *         data:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Admins
 *     summary: Get all users
 *     description: Retrieve a list of all users (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Failed to retrieve users
 */
router.get("/", protect, getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - Admins
 *     summary: Create new user
 *     description: Create a new user account (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: User already exists or invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Failed to create user
 */
router.post("/", protect, allowRoles('admin'), createUser);

// /**
//  * @swagger
//  * /api/users/me:
//  *   get:
//  *     tags:
//  *       - Users
//  *     summary: Get current user profile
//  *     description: Retrieve the authenticated user's own profile information (no role check needed)
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: User profile retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "User profile retrieved successfully"
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: string
//  *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
//  *                     email:
//  *                       type: string
//  *                       format: email
//  *                       example: "user@example.com"
//  *                     name:
//  *                       type: string
//  *                       example: "John Engineer"
//  *                     role:
//  *                       type: string
//  *                       enum: ["admin", "engineer", "supervisor"]
//  *                       example: "engineer"
//  *                     status:
//  *                       type: string
//  *                       enum: ["active", "inactive"]
//  *                       example: "active"
//  *       401:
//  *         description: Unauthorized - Invalid or missing token
//  *       403:
//  *         description: Account is inactive or deactivated
//  *       404:
//  *         description: User not found
//  *       500:
//  *         description: Failed to retrieve user profile
//  */
// router.get("/me", protect, getProfile);

export default router;
