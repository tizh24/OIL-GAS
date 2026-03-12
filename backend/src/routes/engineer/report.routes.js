import express from "express";
import {
    getReportList,
    generateTechnicalReport,
    getReportStatus,
    downloadReport,
    deleteReport
} from "../../controllers/engineer/report.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/engineer/reports:
 *   get:
 *     tags:
 *       - Engineer Reports
 *     summary: Get Report List
 *     description: Retrieve list of reports with filtering and pagination options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [kpi, maintenance, incident, sensor, equipment, custom]
 *         description: Filter by report type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, generating, completed, failed, cancelled]
 *         description: Filter by report status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [operational, technical, safety, environmental, financial, regulatory]
 *         description: Filter by report category
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
 *           default: 10
 *           maximum: 100
 *         description: Number of reports per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
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
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           reportCode:
 *                             type: string
 *                           title:
 *                             type: string
 *                           type:
 *                             type: string
 *                           category:
 *                             type: string
 *                           description:
 *                             type: string
 *                           dateRange:
 *                             type: object
 *                             properties:
 *                               from:
 *                                 type: string
 *                                 format: date-time
 *                               to:
 *                                 type: string
 *                                 format: date-time
 *                           format:
 *                             type: string
 *                           template:
 *                             type: string
 *                           status:
 *                             type: string
 *                           progress:
 *                             type: integer
 *                           fileInfo:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               fileName:
 *                                 type: string
 *                               fileSize:
 *                                 type: integer
 *                               fileSizeMB:
 *                                 type: number
 *                               downloadUrl:
 *                                 type: string
 *                           generation:
 *                             type: object
 *                             properties:
 *                               startedAt:
 *                                 type: string
 *                                 format: date-time
 *                               completedAt:
 *                                 type: string
 *                                 format: date-time
 *                               duration:
 *                                 type: string
 *                               errorMessage:
 *                                 type: string
 *                           usage:
 *                             type: object
 *                             properties:
 *                               downloadCount:
 *                                 type: integer
 *                               viewCount:
 *                                 type: integer
 *                               lastAccessed:
 *                                 type: string
 *                                 format: date-time
 *                           schedule:
 *                             type: object
 *                             nullable: true
 *                           createdBy:
 *                             type: object
 *                           updatedBy:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           reportAge:
 *                             type: string
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                           visibility:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getReportList);

/**
 * @swagger
 * /api/engineer/reports:
 *   post:
 *     tags:
 *       - Engineer Reports
 *     summary: Generate Technical Report
 *     description: Generate a new technical report based on specified parameters and date range
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
 *                 enum: [kpi, maintenance, incident, sensor, equipment, custom]
 *                 description: Type of report to generate
 *               from:
 *                 type: string
 *                 format: date
 *                 description: Start date for report data
 *               to:
 *                 type: string
 *                 format: date
 *                 description: End date for report data
 *               format:
 *                 type: string
 *                 enum: [pdf, excel, csv, json]
 *                 default: pdf
 *                 description: Output format for the report
 *               template:
 *                 type: string
 *                 enum: [standard, executive, detailed, summary]
 *                 default: standard
 *                 description: Report template to use
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Custom title for the report
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Description of the report
 *               filters:
 *                 type: object
 *                 properties:
 *                   locations:
 *                     type: array
 *                     items:
 *                       type: string
 *                   equipmentTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   equipmentIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   sensorTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   sensorIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   severityLevels:
 *                     type: array
 *                     items:
 *                       type: string
 *                   priorities:
 *                     type: array
 *                     items:
 *                       type: string
 *               kpiMetrics:
 *                 type: object
 *                 description: KPI metrics configuration (for KPI reports)
 *                 properties:
 *                   availability:
 *                     type: object
 *                     properties:
 *                       include:
 *                         type: boolean
 *                         default: true
 *                       target:
 *                         type: number
 *                         default: 95
 *                   reliability:
 *                     type: object
 *                     properties:
 *                       include:
 *                         type: boolean
 *                         default: true
 *                       target:
 *                         type: number
 *                         default: 98
 *                   safetyIncidents:
 *                     type: object
 *                     properties:
 *                       include:
 *                         type: boolean
 *                         default: true
 *                       target:
 *                         type: number
 *                         default: 0
 *               distribution:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                         default: false
 *                       recipients:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             email:
 *                               type: string
 *                             name:
 *                               type: string
 *                             role:
 *                               type: string
 *             required:
 *               - type
 *               - from
 *               - to
 *           example:
 *             type: "maintenance"
 *             from: "2026-03-01"
 *             to: "2026-03-10"
 *             format: "pdf"
 *             template: "standard"
 *             title: "Monthly Maintenance Report"
 *             description: "Comprehensive maintenance report for March 2026"
 *             filters:
 *               locations: ["Platform A", "Platform B"]
 *               equipmentTypes: ["pumping", "drilling"]
 *             distribution:
 *               email:
 *                 enabled: false
 *     responses:
 *       200:
 *         description: Report generation initiated successfully
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
 *                     reportId:
 *                       type: string
 *                     reportCode:
 *                       type: string
 *                     status:
 *                       type: string
 *                     estimatedTime:
 *                       type: string
 *                     statusUrl:
 *                       type: string
 *                     downloadUrl:
 *                       type: string
 *       400:
 *         description: Invalid parameters or date range
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), generateTechnicalReport);

/**
 * @swagger
 * /api/engineer/reports/{id}/status:
 *   get:
 *     tags:
 *       - Engineer Reports
 *     summary: Get Report Status
 *     description: Check the current status of report generation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report status retrieved successfully
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
 *                     reportId:
 *                       type: string
 *                     reportCode:
 *                       type: string
 *                     title:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, generating, completed, failed, cancelled]
 *                     progress:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                     generation:
 *                       type: object
 *                       properties:
 *                         startedAt:
 *                           type: string
 *                           format: date-time
 *                         completedAt:
 *                           type: string
 *                           format: date-time
 *                         duration:
 *                           type: string
 *                         errorMessage:
 *                           type: string
 *                     fileInfo:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         fileName:
 *                           type: string
 *                         fileSize:
 *                           type: integer
 *                         fileSizeMB:
 *                           type: number
 *                         format:
 *                           type: string
 *                     isReady:
 *                       type: boolean
 *                     canDownload:
 *                       type: boolean
 *                     createdBy:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/status", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getReportStatus);

/**
 * @swagger
 * /api/engineer/reports/{id}/download:
 *   get:
 *     tags:
 *       - Engineer Reports
 *     summary: Download Report
 *     description: Download the generated report file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Report not ready for download
 *       403:
 *         description: Access denied to download this report
 *       404:
 *         description: Report or file not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/download", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), downloadReport);

/**
 * @swagger
 * /api/engineer/reports/{id}:
 *   delete:
 *     tags:
 *       - Engineer Reports
 *     summary: Delete Report
 *     description: Delete a report (soft delete, only creator or admin can delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
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
 *                     reportId:
 *                       type: string
 *                     reportCode:
 *                       type: string
 *       403:
 *         description: Access denied to delete this report
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), deleteReport);

export default router;
