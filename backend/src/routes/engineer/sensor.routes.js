import express from "express";
import {
    getRealTimeSensorData,
    getSensorTrends,
    updateSensorReading,
    getSensorAlarms,
    acknowledgeSensorAlarm,
    getSensorDashboard
} from "../../controllers/engineer/sensor.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/engineer/sensors/realtime:
 *   get:
 *     tags:
 *       - Engineer Sensors
 *     summary: Get Real-time Sensor Data
 *     description: Retrieve real-time sensor readings with pressure, temperature, and device status information. Supports filtering by equipment, sensor type, and location.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: equipmentId
 *         schema:
 *           type: string
 *         description: Filter by specific equipment ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pressure, temperature, flow, level, vibration, gas, ph, conductivity, other]
 *         description: Filter by sensor type
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (partial match)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, offline, maintenance, error, calibrating]
 *         description: Filter by sensor status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 500
 *         description: Number of sensors per page
 *     responses:
 *       200:
 *         description: Real-time sensor data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sensors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sensorId:
 *                             type: string
 *                           sensorCode:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           equipment:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               type:
 *                                 type: string
 *                               location:
 *                                 type: string
 *                           location:
 *                             type: string
 *                           currentReading:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: number
 *                               unit:
 *                                 type: string
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               quality:
 *                                 type: string
 *                               formattedValue:
 *                                 type: string
 *                           status:
 *                             type: string
 *                           health:
 *                             type: string
 *                           alarmStatus:
 *                             type: string
 *                           activeAlarms:
 *                             type: array
 *                             items:
 *                               type: object
 *                           thresholds:
 *                             type: object
 *                           calibration:
 *                             type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSensors:
 *                           type: integer
 *                         onlineSensors:
 *                           type: integer
 *                         sensorsWithAlarms:
 *                           type: integer
 *                         sensorTypes:
 *                           type: array
 *                           items:
 *                             type: string
 *                         locations:
 *                           type: array
 *                           items:
 *                             type: string
 *                         lastUpdate:
 *                           type: string
 *                           format: date-time
 *                     pagination:
 *                       type: object
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/realtime", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getRealTimeSensorData);

/**
 * @swagger
 * /api/engineer/sensors/{id}/trends:
 *   get:
 *     tags:
 *       - Engineer Sensors
 *     summary: Get Sensor Trends and Historical Data
 *     description: Retrieve historical sensor data and trends for analysis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sensor ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time period for historical data
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [1m, 5m, 15m, 1h, 1d]
 *           default: 1h
 *         description: Data interval grouping
 *     responses:
 *       200:
 *         description: Sensor trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sensor:
 *                       type: object
 *                     period:
 *                       type: string
 *                     timeRange:
 *                       type: object
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: number
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           quality:
 *                             type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                         max:
 *                           type: number
 *                         avg:
 *                           type: number
 *                         count:
 *                           type: integer
 *                         latest:
 *                           type: number
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/trends", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getSensorTrends);

/**
 * @swagger
 * /api/engineer/sensors/{id}/reading:
 *   post:
 *     tags:
 *       - Engineer Sensors
 *     summary: Update Sensor Reading
 *     description: Update sensor reading value (for simulation or manual entry)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sensor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 description: New sensor reading value
 *               quality:
 *                 type: string
 *                 enum: [good, bad, uncertain, substituted]
 *                 default: good
 *                 description: Data quality indicator
 *             required:
 *               - value
 *           example:
 *             value: 125.5
 *             quality: "good"
 *     responses:
 *       200:
 *         description: Sensor reading updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sensorId:
 *                       type: string
 *                     sensorCode:
 *                       type: string
 *                     currentReading:
 *                       type: object
 *                     alarmStatus:
 *                       type: string
 *                     activeAlarms:
 *                       type: array
 *       400:
 *         description: Invalid value or parameters
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/reading", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), updateSensorReading);

/**
 * @swagger
 * /api/engineer/sensors/alarms:
 *   get:
 *     tags:
 *       - Engineer Sensors
 *     summary: Get Sensor Alarms
 *     description: Retrieve active sensor alarms with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [warning, alarm, critical]
 *         description: Filter by alarm severity
 *       - in: query
 *         name: acknowledged
 *         schema:
 *           type: boolean
 *         description: Filter by acknowledgment status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 200
 *         description: Maximum number of alarms to return
 *     responses:
 *       200:
 *         description: Sensor alarms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     alarms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sensorId:
 *                             type: string
 *                           sensorCode:
 *                             type: string
 *                           sensorName:
 *                             type: string
 *                           sensorType:
 *                             type: string
 *                           location:
 *                             type: string
 *                           equipment:
 *                             type: object
 *                           alarm:
 *                             type: object
 *                             properties:
 *                               alarmId:
 *                                 type: string
 *                               type:
 *                                 type: string
 *                               message:
 *                                 type: string
 *                               value:
 *                                 type: number
 *                               threshold:
 *                                 type: number
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               acknowledged:
 *                                 type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         critical:
 *                           type: integer
 *                         alarm:
 *                           type: integer
 *                         warning:
 *                           type: integer
 *                         acknowledged:
 *                           type: integer
 *                         unacknowledged:
 *                           type: integer
 *       500:
 *         description: Internal server error
 */
router.get("/alarms", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getSensorAlarms);

/**
 * @swagger
 * /api/engineer/sensors/{id}/alarms/{alarmId}/acknowledge:
 *   post:
 *     tags:
 *       - Engineer Sensors
 *     summary: Acknowledge Sensor Alarm
 *     description: Acknowledge a specific sensor alarm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sensor ID
 *       - in: path
 *         name: alarmId
 *         required: true
 *         schema:
 *           type: string
 *         description: Alarm ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional acknowledgment note
 *           example:
 *             note: "Investigating temperature sensor calibration. Maintenance scheduled."
 *     responses:
 *       200:
 *         description: Alarm acknowledged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sensorId:
 *                       type: string
 *                     sensorCode:
 *                       type: string
 *                     alarmId:
 *                       type: string
 *                     acknowledgedAt:
 *                       type: string
 *                       format: date-time
 *                     acknowledgedBy:
 *                       type: string
 *       400:
 *         description: Alarm already acknowledged or invalid parameters
 *       404:
 *         description: Sensor or alarm not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/alarms/:alarmId/acknowledge", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), acknowledgeSensorAlarm);

/**
 * @swagger
 * /api/engineer/sensors/dashboard:
 *   get:
 *     tags:
 *       - Engineer Sensors
 *     summary: Get Sensor Dashboard Data
 *     description: Retrieve comprehensive sensor dashboard data including statistics, alarms, and trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time range for dashboard metrics
 *     responses:
 *       200:
 *         description: Sensor dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalSensors:
 *                           type: integer
 *                         onlineSensors:
 *                           type: integer
 *                         offlineSensors:
 *                           type: integer
 *                         availabilityRate:
 *                           type: string
 *                     sensorTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           online:
 *                             type: integer
 *                     alarms:
 *                       type: object
 *                       properties:
 *                         critical:
 *                           type: integer
 *                         alarm:
 *                           type: integer
 *                         warning:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                     calibration:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: integer
 *                         dueSoon:
 *                           type: integer
 *                         overdue:
 *                           type: integer
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getSensorDashboard);

export default router;
