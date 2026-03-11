import express from "express";
import {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
    addIncidentComment,
    getIncidentComments,
    getAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
    acknowledgeAlert,
    bulkAcknowledgeAlerts
} from "../../controllers/engineer/incident.controller.js";
import {
    authenticateToken,
    requireRole,
    requireRoles
} from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import {
    createIncidentValidationSchema,
    updateIncidentValidationSchema,
    incidentCommentValidationSchema,
    incidentFilterValidationSchema,
    createAlertValidationSchema,
    updateAlertValidationSchema,
    acknowledgeAlertValidationSchema,
    bulkAcknowledgeAlertsValidationSchema,
    alertFilterValidationSchema,
    mongoIdValidationSchema
} from "../../utils/validation.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Incident:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - severity
 *         - incidentType
 *         - location
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated incident ID
 *         incidentCode:
 *           type: string
 *           description: Auto-generated incident code (INC_00001)
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           description: Incident title
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *           description: Detailed incident description
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Incident severity level
 *         status:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *           description: Current incident status
 *         incidentType:
 *           type: string
 *           enum: [equipment_failure, safety_violation, environmental_incident, operational_issue, maintenance_required, security_breach, other]
 *           description: Type of incident
 *         location:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           description: Incident location
 *         equipment:
 *           type: string
 *           description: Related equipment (optional)
 *         instrument:
 *           type: string
 *           description: Related instrument (optional)
 *         reportedBy:
 *           type: string
 *           description: User ID who reported the incident
 *         assignedTo:
 *           type: string
 *           description: User ID assigned to handle the incident
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Incident priority level
 *         reportedAt:
 *           type: string
 *           format: date-time
 *           description: When the incident was reported
 *         estimatedResolutionTime:
 *           type: string
 *           format: date-time
 *           description: Estimated time for resolution
 *         actualResolutionTime:
 *           type: string
 *           format: date-time
 *           description: Actual time when resolved
 *         resolution:
 *           type: string
 *           description: Resolution details
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *               author:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 * 
 *     Alert:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - severity
 *         - alertType
 *         - source
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated alert ID
 *         alertCode:
 *           type: string
 *           description: Auto-generated alert code (ALT_00001)
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           description: Alert title
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: Alert description
 *         severity:
 *           type: string
 *           enum: [info, warning, error, critical]
 *           description: Alert severity level
 *         status:
 *           type: string
 *           enum: [active, acknowledged, resolved]
 *           description: Current alert status
 *         alertType:
 *           type: string
 *           enum: [system, equipment, safety, environmental, operational, maintenance, security]
 *           description: Type of alert
 *         source:
 *           type: string
 *           description: Source of the alert
 *         equipment:
 *           type: string
 *           description: Related equipment (optional)
 *         instrument:
 *           type: string
 *           description: Related instrument (optional)
 *         threshold:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             condition:
 *               type: string
 *               enum: [greater_than, less_than, equal_to, not_equal_to]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Alert priority level
 *         triggeredAt:
 *           type: string
 *           format: date-time
 *           description: When the alert was triggered
 *         acknowledgedAt:
 *           type: string
 *           format: date-time
 *           description: When the alert was acknowledged
 *         acknowledgedBy:
 *           type: string
 *           description: User ID who acknowledged the alert
 *         acknowledgmentNote:
 *           type: string
 *           description: Note added during acknowledgment
 */

// ================================
// INCIDENT MANAGEMENT ROUTES
// ================================

/**
 * @swagger
 * /api/engineer/incidents:
 *   get:
 *     summary: Get incidents list with filters and pagination
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filter by status
 *       - in: query
 *         name: incidentType
 *         schema:
 *           type: string
 *         description: Filter by incident type
 *       - in: query
 *         name: instrument
 *         schema:
 *           type: string
 *         description: Filter by instrument
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         description: Filter by equipment
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: reportedBy
 *         schema:
 *           type: string
 *         description: Filter by reporter user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Incidents retrieved successfully
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
 *                     incidents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Incident'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_items:
 *                           type: integer
 *                         items_per_page:
 *                           type: integer
 *       400:
 *         description: Invalid filter parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
    "/incidents",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(incidentFilterValidationSchema, 'query'),
    getIncidents
);

/**
 * @swagger
 * /api/engineer/incidents/{id}:
 *   get:
 *     summary: Get incident by ID
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident retrieved successfully
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
 *                   $ref: '#/components/schemas/Incident'
 *       404:
 *         description: Incident not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
    "/incidents/:id",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(mongoIdValidationSchema, 'params'),
    getIncidentById
);

/**
 * @swagger
 * /api/engineer/incidents:
 *   post:
 *     summary: Create a new incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - severity
 *               - incidentType
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               incidentType:
 *                 type: string
 *                 enum: [equipment_failure, safety_violation, environmental_incident, operational_issue, maintenance_required, security_breach, other]
 *               location:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               equipment:
 *                 type: string
 *               instrument:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               estimatedResolutionTime:
 *                 type: string
 *                 format: date-time
 *           example:
 *             title: "Equipment Malfunction - Pump #3"
 *             description: "Main circulation pump #3 showing abnormal vibration levels and temperature readings exceeding normal operational parameters"
 *             severity: "high"
 *             incidentType: "equipment_failure"
 *             location: "Pump Station A"
 *             equipment: "Centrifugal Pump CP-003"
 *             instrument: "Vibration Sensor VS-003"
 *             priority: "high"
 *             estimatedResolutionTime: "2026-03-12T10:00:00Z"
 *     responses:
 *       201:
 *         description: Incident created successfully
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
 *                   $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    "/incidents",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(createIncidentValidationSchema),
    createIncident
);

/**
 * @swagger
 * /api/engineer/incidents/{id}:
 *   put:
 *     summary: Update an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *               incidentType:
 *                 type: string
 *                 enum: [equipment_failure, safety_violation, environmental_incident, operational_issue, maintenance_required, security_breach, other]
 *               location:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               equipment:
 *                 type: string
 *               instrument:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               estimatedResolutionTime:
 *                 type: string
 *                 format: date-time
 *               resolution:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *           example:
 *             status: "in_progress"
 *             assignedTo: "60f7d2c2f8b6c8001f8e4d21"
 *             estimatedResolutionTime: "2026-03-12T14:00:00Z"
 *             resolution: "Replacement parts have been ordered and maintenance team is scheduled for tomorrow"
 *     responses:
 *       200:
 *         description: Incident updated successfully
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
 *                   $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Incident not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
    "/incidents/:id",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(mongoIdValidationSchema, 'params'),
    validateRequest(updateIncidentValidationSchema),
    updateIncident
);

/**
 * @swagger
 * /api/engineer/incidents/{id}:
 *   delete:
 *     summary: Delete an incident (soft delete)
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Incident not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.delete(
    "/incidents/:id",
    authenticateToken,
    requireRole('admin'),
    validateRequest(mongoIdValidationSchema, 'params'),
    deleteIncident
);

/**
 * @swagger
 * /api/engineer/incidents/{id}/comments:
 *   post:
 *     summary: Add a comment to an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 1000
 *           example:
 *             comment: "Initial inspection completed. Vibration levels confirmed to be 40% above normal threshold."
 *     responses:
 *       201:
 *         description: Comment added successfully
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
 *                   $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Invalid comment data
 *       404:
 *         description: Incident not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    "/incidents/:id/comments",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(mongoIdValidationSchema, 'params'),
    validateRequest(incidentCommentValidationSchema),
    addIncidentComment
);

/**
 * @swagger
 * /api/engineer/incidents/{id}/comments:
 *   get:
 *     summary: Get comments for an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       comment:
 *                         type: string
 *                       author:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Incident not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
    "/incidents/:id/comments",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(mongoIdValidationSchema, 'params'),
    getIncidentComments
);

// ================================
// ALERT MANAGEMENT ROUTES
// ================================

/**
 * @swagger
 * /api/engineer/alerts:
 *   get:
 *     summary: Get alerts list with filters and pagination
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, error, critical]
 *         description: Filter by severity level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, acknowledged, resolved]
 *         description: Filter by status
 *       - in: query
 *         name: alertType
 *         schema:
 *           type: string
 *         description: Filter by alert type
 *       - in: query
 *         name: instrument
 *         schema:
 *           type: string
 *         description: Filter by instrument
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         description: Filter by equipment
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
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
 *                     alerts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Alert'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_items:
 *                           type: integer
 *                         items_per_page:
 *                           type: integer
 *       400:
 *         description: Invalid filter parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
    "/alerts",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(alertFilterValidationSchema, 'query'),
    getAlerts
);

/**
 * @swagger
 * /api/engineer/alerts/{id}:
 *   get:
 *     summary: Get alert by ID
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert retrieved successfully
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
 *                   $ref: '#/components/schemas/Alert'
 *       404:
 *         description: Alert not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
    "/alerts/:id",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(mongoIdValidationSchema, 'params'),
    getAlertById
);

/**
 * @swagger
 * /api/engineer/alerts:
 *   post:
 *     summary: Create a new alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - severity
 *               - alertType
 *               - source
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               severity:
 *                 type: string
 *                 enum: [info, warning, error, critical]
 *               alertType:
 *                 type: string
 *                 enum: [system, equipment, safety, environmental, operational, maintenance, security]
 *               source:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               equipment:
 *                 type: string
 *               instrument:
 *                 type: string
 *               threshold:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   condition:
 *                     type: string
 *                     enum: [greater_than, less_than, equal_to, not_equal_to]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *           example:
 *             title: "High Temperature Alert"
 *             description: "Temperature sensor reading exceeds safe operational limits"
 *             severity: "critical"
 *             alertType: "equipment"
 *             source: "Temperature Monitoring System"
 *             equipment: "Heat Exchanger HX-001"
 *             instrument: "Temperature Sensor TS-001"
 *             threshold:
 *               value: 85
 *               unit: "°C"
 *               condition: "greater_than"
 *             priority: "urgent"
 *     responses:
 *       201:
 *         description: Alert created successfully
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
 *                   $ref: '#/components/schemas/Alert'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    "/alerts",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(createAlertValidationSchema),
    createAlert
);

/**
 * @swagger
 * /api/engineer/alerts/{id}:
 *   put:
 *     summary: Update an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               severity:
 *                 type: string
 *                 enum: [info, warning, error, critical]
 *               status:
 *                 type: string
 *                 enum: [active, acknowledged, resolved]
 *               alertType:
 *                 type: string
 *                 enum: [system, equipment, safety, environmental, operational, maintenance, security]
 *               source:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               equipment:
 *                 type: string
 *               instrument:
 *                 type: string
 *               threshold:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   condition:
 *                     type: string
 *                     enum: [greater_than, less_than, equal_to, not_equal_to]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *           example:
 *             status: "acknowledged"
 *             priority: "high"
 *     responses:
 *       200:
 *         description: Alert updated successfully
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
 *                   $ref: '#/components/schemas/Alert'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Alert not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
    "/alerts/:id",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(mongoIdValidationSchema, 'params'),
    validateRequest(updateAlertValidationSchema),
    updateAlert
);

/**
 * @swagger
 * /api/engineer/alerts/{id}:
 *   delete:
 *     summary: Delete an alert (soft delete)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Alert not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.delete(
    "/alerts/:id",
    authenticateToken,
    requireRole('admin'),
    validateRequest(mongoIdValidationSchema, 'params'),
    deleteAlert
);

/**
 * @swagger
 * /api/engineer/alerts/{id}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               acknowledgmentNote:
 *                 type: string
 *                 maxLength: 500
 *           example:
 *             acknowledgmentNote: "Alert acknowledged. Investigating temperature sensor calibration."
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
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
 *                   $ref: '#/components/schemas/Alert'
 *       400:
 *         description: Alert already acknowledged or invalid data
 *       404:
 *         description: Alert not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    "/alerts/:id/acknowledge",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(mongoIdValidationSchema, 'params'),
    validateRequest(acknowledgeAlertValidationSchema),
    acknowledgeAlert
);

/**
 * @swagger
 * /api/engineer/alerts/bulk-acknowledge:
 *   post:
 *     summary: Acknowledge multiple alerts at once
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alertIds
 *             properties:
 *               alertIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 50
 *               acknowledgmentNote:
 *                 type: string
 *                 maxLength: 500
 *           example:
 *             alertIds: ["60f7d2c2f8b6c8001f8e4d21", "60f7d2c2f8b6c8001f8e4d22"]
 *             acknowledgmentNote: "Bulk acknowledgment - investigating common temperature issue"
 *     responses:
 *       200:
 *         description: Alerts acknowledged successfully
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
 *                     acknowledged_count:
 *                       type: integer
 *                     failed_count:
 *                       type: integer
 *                     failed_alerts:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid alert IDs or data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    "/alerts/bulk-acknowledge",
    authenticateToken,
    requireRoles(['admin', 'engineer', 'manager']),
    validateRequest(bulkAcknowledgeAlertsValidationSchema),
    bulkAcknowledgeAlerts
);

export default router;