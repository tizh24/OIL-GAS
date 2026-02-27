import express from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "password123"
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
 *           enum: ["admin", "engineer", "supervisor"]
 *           default: engineer
 *           example: "engineer"
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           example: "password123"
 *     RefreshToken:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 */

// /**
//  * @swagger
//  * /api/auth/register:
//  *   post:
//  *     tags:    
//  *       - Authentication
//  *     summary: Register a new user
//  *     description: Create a new user account
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/UserRegistration'
//  *     responses:
//  *       200:
//  *         description: User registered successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/AuthResponse'
//  *       400:
//  *         description: User already exists or invalid input
//  *       500:
//  *         description: Registration failed
//  */
// router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user and get access tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */
router.post("/login", login);

// /**
//  * @swagger
//  * /api/auth/refresh:
//  *   post:
//  *     tags:
//  *       - Authentication
//  *     summary: Refresh access token
//  *     description: Get a new access token using refresh token
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/RefreshToken'
//  *     responses:
//  *       200:
//  *         description: Token refreshed successfully
//  *       400:
//  *         description: Refresh token is required
//  *       401:
//  *         description: Invalid or expired refresh token
//  *       500:
//  *         description: Token refresh failed
//  */
// router.post("/refresh", refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Invalidate refresh token and logout user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Refresh token is required
 *       404:
 *         description: Refresh token not found
 *       500:
 *         description: Logout failed
 */
router.post("/logout", logout);

export default router;
