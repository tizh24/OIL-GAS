import express from 'express';
import supervisorController from '../../controllers/supervisors/supervisor.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();
const allow = allowRoles('supervisor', 'admin');

/**
 * @swagger
 * /api/supervisors/equipment:
 *   get:
 *     tags:
 *       - Supervisor Equipment
 *     summary: Get equipment list
 *     description: Retrieve equipment list with filtering and pagination (supervisor access)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by equipment status
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (partial match)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text search on equipment name/manufacturer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Equipment list retrieved successfully
 */
router.get('/equipment', protect, allow, supervisorController.getEquipmentList);

/**
 * @swagger
 * /api/supervisors/equipment/{id}:
 *   get:
 *     tags:
 *       - Supervisor Equipment
 *     summary: Get equipment detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID
 *     responses:
 *       200:
 *         description: Equipment detail retrieved successfully
 */
router.get('/equipment/:id', protect, allow, supervisorController.getEquipmentDetail);

/**
 * @swagger
 * /api/supervisors/instruments:
 *   get:
 *     tags:
 *       - Supervisor Instruments
 *     summary: Get instruments list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: equipmentId
 *         schema:
 *           type: string
 *         description: Filter by equipment id
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Instrument type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Instrument status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Instruments list retrieved successfully
 */
router.get('/instruments', protect, allow, supervisorController.getInstrumentsList);

/**
 * @swagger
 * /api/supervisors/instruments/{id}:
 *   get:
 *     tags:
 *       - Supervisor Instruments
 *     summary: Get instrument detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instrument detail retrieved successfully
 */
router.get('/instruments/:id', protect, allow, supervisorController.getInstrumentDetail);

/**
 * @swagger
 * /api/supervisors/alerts:
 *   get:
 *     tags:
 *       - Supervisor Alerts
 *     summary: Get alerts list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: equipmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Alerts list retrieved successfully
 */
router.get('/alerts', protect, allow, supervisorController.getAlertsList);

/**
 * @swagger
 * /api/supervisors/alerts/{id}:
 *   get:
 *     tags:
 *       - Supervisor Alerts
 *     summary: Get alert detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert detail retrieved successfully
 */
router.get('/alerts/:id', protect, allow, supervisorController.getAlertDetail);

/**
 * @swagger
 * /api/supervisors/incidents:
 *   get:
 *     tags:
 *       - Supervisor Incidents
 *     summary: Get incidents list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: equipmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedEngineer
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Incidents list retrieved successfully
 */
router.get('/incidents', protect, allow, supervisorController.getIncidentsList);

/**
 * @swagger
 * /api/supervisors/incidents/{id}:
 *   get:
 *     tags:
 *       - Supervisor Incidents
 *     summary: Get incident detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Incident detail retrieved successfully
 */
router.get('/incidents/:id', protect, allow, supervisorController.getIncidentDetail);

/**
 * @swagger
 * /api/supervisors/incidents/{id}/assign:
 *   patch:
 *     tags:
 *       - Supervisor Incidents
 *     summary: Assign engineer to incident
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               engineerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Engineer assigned successfully
 */
router.patch('/incidents/:id/assign', protect, allow, supervisorController.assignEngineerToIncident);

/**
 * @swagger
 * /api/supervisors/maintenance-records:
 *   get:
 *     tags:
 *       - Supervisor Maintenance
 *     summary: Get maintenance records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: equipmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: engineerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Maintenance records retrieved successfully
 */
router.get('/maintenance-records', protect, allow, supervisorController.getMaintenanceRecords);

/**
 * @swagger
 * /api/supervisors/maintenance-records/{id}:
 *   get:
 *     tags:
 *       - Supervisor Maintenance
 *     summary: Get maintenance detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance detail retrieved successfully
 */
router.get('/maintenance-records/:id', protect, allow, supervisorController.getMaintenanceDetail);

/**
 * @swagger
 * /api/supervisors/sensor-data:
 *   get:
 *     tags:
 *       - Supervisor SensorData
 *     summary: Get sensor data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instrumentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Sensor data retrieved successfully
 */
router.get('/sensor-data', protect, allow, supervisorController.getSensorData);

/**
 * @swagger
 * /api/supervisors/sensor-data/realtime:
 *   get:
 *     tags:
 *       - Supervisor SensorData
 *     summary: Get realtime sensor data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: equipmentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Realtime sensor data retrieved successfully
 */
router.get('/sensor-data/realtime', protect, allow, supervisorController.getRealtimeSensorData);

/**
 * @swagger
 * /api/supervisors/oil-output:
 *   get:
 *     tags:
 *       - Supervisor OilOutput
 *     summary: Get oil output
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: wellId
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Oil output retrieved successfully
 */
router.get('/oil-output', protect, allow, supervisorController.getOilOutput);

/**
 * @swagger
 * /api/supervisors/reports:
 *   post:
 *     tags:
 *       - Supervisor Reports
 *     summary: Generate report
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: ["INCIDENT_REPORT","MAINTENANCE_REPORT","PRODUCTION_REPORT"]
 *               fromDate:
 *                 type: string
 *                 format: date
 *               toDate:
 *                 type: string
 *                 format: date
 *               format:
 *                 type: string
 *                 enum: ["pdf","csv"]
 *     responses:
 *       200:
 *         description: Report generation requested
 */
router.post('/reports', protect, allow, supervisorController.generateReport);

export default router;
