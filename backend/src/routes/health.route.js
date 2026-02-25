import express from "express";

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check
 *     description: Check if API server is running without requiring database access
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running",
        data: {
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }
    });
});

export default router;
