import express from "express";
import {
    getUsers,
    createUser,
    updateUser,
    updateProfile,
    getProfile,
    deleteUser,
    restoreUser,
    getDeletedUsers,
    getAllUsers
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { validateBody, validateParams, sanitize } from "../middlewares/validation.middleware.js";
import {
    createUserValidationSchema,
    updateUserValidationSchema,
    updateProfileValidationSchema,
    mongoIdValidationSchema
} from "../utils/validation.js";

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
 *     summary: Get all active users
 *     description: Retrieve a list of all active users only (requires authentication)
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
router.post("/", protect, allowRoles('admin'), sanitize(['name', 'email']), validateBody(createUserValidationSchema), createUser);

/**
 * @swagger
 * /api/users/deleted:
 *   get:
 *     tags:
 *       - Admins
 *     summary: Get all deleted users
 *     description: Retrieve a list of all soft-deleted users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Failed to retrieve deleted users
 */
router.get("/deleted", protect, allowRoles('admin'), getDeletedUsers);

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     tags:
 *       - Admins
 *     summary: Get all users (active and inactive)
 *     description: Retrieve a list of all users regardless of status (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Failed to retrieve users
 */
router.get("/all", protect, allowRoles('admin'), getAllUsers);

/**
 * @swagger
 * /api/users/{id}/delete:
 *   delete:
 *     tags:
 *       - Admins
 *     summary: Soft delete user
 *     description: Soft delete a user (set status to inactive and mark as deleted)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: User is already deleted
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */
router.delete("/:id/delete", protect, allowRoles('admin'), validateParams(mongoIdValidationSchema), deleteUser);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   patch:
 *     tags:
 *       - Admins
 *     summary: Restore deleted user
 *     description: Restore a soft-deleted user (set status back to active)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: User is not deleted
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to restore user
 */
router.patch("/:id/restore", protect, allowRoles('admin'), validateParams(mongoIdValidationSchema), restoreUser);


/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's own profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized or account not active
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve profile
 */
router.get("/profile", protect, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     description: Update the authenticated user's own profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: '^[a-zA-Z\s]+$'
 *                 example: "John Updated Engineer"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.updated@company.com"
 *               phone:
 *                 type: string
 *                 pattern: '^[\+]?[1-9][\d]{0,15}$'
 *                 example: "+1234567890"
 *               department:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Updated Engineering Department"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation error or email already in use
 *       401:
 *         description: Unauthorized or account not active
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update profile
 */
router.put("/profile", protect, sanitize(['name', 'email', 'phone', 'department']), validateBody(updateProfileValidationSchema), updateProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Admins
 *     summary: Update user (Admin only)
 *     description: Update a specific user's information (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: User ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: '^[a-zA-Z\s]+$'
 *                 example: "John Updated Engineer"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.updated@company.com"
 *               phone:
 *                 type: string
 *                 pattern: '^[\+]?[1-9][\d]{0,15}$'
 *                 example: "+1234567890"
 *               department:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Updated Engineering Department"
 *               role:
 *                 type: string
 *                 enum: ["admin", "engineer", "supervisor"]
 *                 example: "engineer"
 *               status:
 *                 type: string
 *                 enum: ["active", "inactive"]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation error or email already in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user
 */
router.put("/:id", protect, allowRoles('admin'), validateParams(mongoIdValidationSchema), sanitize(['name', 'email', 'phone', 'department']), validateBody(updateUserValidationSchema), updateUser);


export default router;
