import express from "express";
import {
    visualize3DInstrument,
    getEquipmentControlInfo,
    update3DVisualizationSettings,
    addTrainingSession,
    upload3DModel,
    get3DModelStatus,
    get3DModelLoadingConfig
} from "../../controllers/engineer/3d.controller.js";
import { authenticateToken, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/3d/instruments/{id}/visualize:
 *   get:
 *     tags:
 *       - 3D Visualization
 *     summary: Visualize 3D Instrument with Zoom/Rotate/Lighting controls
 *     description: Get comprehensive 3D visualization data for an instrument including camera settings, lighting configuration, interactive controls, and real-time operational data for training and analysis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [low, medium, high, ultra]
 *         description: Rendering quality override
 *       - in: query
 *         name: lighting
 *         schema:
 *           type: string
 *           enum: [default, enhanced, minimal]
 *         description: Lighting configuration preset
 *       - in: query
 *         name: controls
 *         schema:
 *           type: string
 *         description: JSON string of control overrides (e.g. {"autoRotate":true})
 *     responses:
 *       200:
 *         description: 3D visualization data retrieved successfully
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
 *                     visualization:
 *                       type: object
 *                       properties:
 *                         camera:
 *                           type: object
 *                           properties:
 *                             position:
 *                               type: object
 *                               properties:
 *                                 x:
 *                                   type: number
 *                                 y:
 *                                   type: number
 *                                 z:
 *                                   type: number
 *                             rotation:
 *                               type: object
 *                             fov:
 *                               type: number
 *                         lighting:
 *                           type: object
 *                           properties:
 *                             ambient:
 *                               type: object
 *                               properties:
 *                                 color:
 *                                   type: string
 *                                 intensity:
 *                                   type: number
 *                             directional:
 *                               type: object
 *                         controls:
 *                           type: object
 *                           properties:
 *                             enableZoom:
 *                               type: boolean
 *                             enableRotate:
 *                               type: boolean
 *                             enablePan:
 *                               type: boolean
 *                         rendering:
 *                           type: object
 *                           properties:
 *                             backgroundColor:
 *                               type: string
 *                             quality:
 *                               type: string
 *                     instrument:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         type:
 *                           type: string
 *                         status:
 *                           type: string
 *                     realTimeData:
 *                       type: object
 *                       properties:
 *                         operationalParameters:
 *                           type: object
 *                         status:
 *                           type: string
 *                         alarmStatus:
 *                           type: string
 *                         performance:
 *                           type: object
 *                     interactionGuide:
 *                       type: object
 *                       properties:
 *                         zoom:
 *                           type: string
 *                         rotate:
 *                           type: string
 *                         pan:
 *                           type: string
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Instrument not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/instruments/:id/visualize", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), visualize3DInstrument);

/**
 * @swagger
 * /api/control/equipment/{id}:
 *   get:
 *     tags:
 *       - Equipment Control
 *     summary: View Equipment Control Information
 *     description: Get comprehensive equipment control information including operational settings, alarms, current status, and alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID (Numeric)
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include historical control data
 *     responses:
 *       200:
 *         description: Equipment control information retrieved successfully
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
 *                     equipment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         type:
 *                           type: string
 *                         location:
 *                           type: string
 *                     operationalSettings:
 *                       type: object
 *                       properties:
 *                         setPoints:
 *                           type: object
 *                           properties:
 *                             primary:
 *                               type: number
 *                             secondary:
 *                               type: number
 *                             mode:
 *                               type: string
 *                         controlLoop:
 *                           type: object
 *                           properties:
 *                             enabled:
 *                               type: boolean
 *                             pid:
 *                               type: object
 *                         safetyLimits:
 *                           type: object
 *                           properties:
 *                             high:
 *                               type: number
 *                             low:
 *                               type: number
 *                     currentStatus:
 *                       type: object
 *                       properties:
 *                         primaryValue:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: number
 *                             unit:
 *                               type: string
 *                             quality:
 *                               type: string
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                         systemHealth:
 *                           type: object
 *                           properties:
 *                             overall:
 *                               type: string
 *                             calibrationStatus:
 *                               type: string
 *                             maintenanceStatus:
 *                               type: string
 *                         performance:
 *                           type: object
 *                           properties:
 *                             accuracy:
 *                               type: number
 *                             stability:
 *                               type: number
 *                             uptime:
 *                               type: number
 *                     alarmsAndAlerts:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               type:
 *                                 type: string
 *                               message:
 *                                 type: string
 *                               priority:
 *                                 type: string
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               acknowledged:
 *                                 type: boolean
 *                         recent:
 *                           type: array
 *                           items:
 *                             type: object
 *                         priority:
 *                           type: object
 *                           properties:
 *                             critical:
 *                               type: integer
 *                             high:
 *                               type: integer
 *                             medium:
 *                               type: integer
 *                             low:
 *                               type: integer
 *                     availableActions:
 *                       type: object
 *                       properties:
 *                         remote:
 *                           type: object
 *                           properties:
 *                             setPointAdjustment:
 *                               type: boolean
 *                             modeChange:
 *                               type: boolean
 *                             calibration:
 *                               type: boolean
 *                     assignedEngineers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/equipment/:id", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), getEquipmentControlInfo);

/**
 * @swagger
 * /api/3d/instruments/{id}/settings:
 *   put:
 *     tags:
 *       - 3D Visualization
 *     summary: Update 3D visualization settings
 *     description: Update camera, lighting, controls, and interactive elements for 3D visualization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visualization:
 *                 type: object
 *                 properties:
 *                   camera:
 *                     type: object
 *                   lighting:
 *                     type: object
 *                   controls:
 *                     type: object
 *                   rendering:
 *                     type: object
 *               interactiveElements:
 *                 type: array
 *                 items:
 *                   type: object
 *               metadata:
 *                 type: object
 *           example:
 *             visualization:
 *               camera:
 *                 position:
 *                   x: 2
 *                   y: 2
 *                   z: 5
 *               lighting:
 *                 ambient:
 *                   intensity: 0.5
 *               controls:
 *                 autoRotate: true
 *                 autoRotateSpeed: 1.5
 *     responses:
 *       200:
 *         description: 3D visualization settings updated successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: 3D visualization not found
 *       500:
 *         description: Internal Server Error
 */
router.put("/instruments/:id/settings", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), update3DVisualizationSettings);

/**
 * @swagger
 * /api/3d/instruments/{id}/training:
 *   post:
 *     tags:
 *       - 3D Visualization
 *     summary: Record training session data
 *     description: Add training session data for analysis and progress tracking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *                 description: Session duration in seconds
 *               interactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     data:
 *                       type: object
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               completionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               feedback:
 *                 type: string
 *           example:
 *             startTime: "2026-03-02T10:00:00.000Z"
 *             endTime: "2026-03-02T10:30:00.000Z"
 *             duration: 1800
 *             interactions:
 *               - action: "rotate_model"
 *                 timestamp: "2026-03-02T10:05:00.000Z"
 *                 data: { angle: 45, axis: "y" }
 *               - action: "click_hotspot"
 *                 timestamp: "2026-03-02T10:10:00.000Z"
 *                 data: { elementId: "sensor_1" }
 *             score: 85
 *             completionRate: 90
 *             feedback: "Good understanding of instrument operation"
 *     responses:
 *       200:
 *         description: Training session recorded successfully
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
 *                     sessionId:
 *                       type: string
 *                     stats:
 *                       type: object
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: 3D visualization not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/instruments/:id/training", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), addTrainingSession);

/**
 * @swagger
 * /api/3d/instruments/{id}/upload:
 *   post:
 *     tags:
 *       - 3D Model Management
 *     summary: Upload 3D model for instrument
 *     description: Upload a GLTF/GLB or other 3D model file for an instrument with automatic processing and validation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Final file name
 *               originalFileName:
 *                 type: string
 *                 description: Original uploaded file name
 *               filePath:
 *                 type: string
 *                 description: Server file path
 *               fileUrl:
 *                 type: string
 *                 description: Public URL for file access
 *               fileSize:
 *                 type: number
 *                 description: File size in bytes
 *               format:
 *                 type: string
 *                 enum: [GLTF, GLB, FBX, OBJ, 3DS, STL]
 *                 description: 3D model format
 *               metadata:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                     enum: [training, maintenance, inspection, simulation, documentation]
 *             required:
 *               - fileName
 *               - filePath
 *               - fileSize
 *               - format
 *           example:
 *             fileName: "pressure_transmitter_PT001.gltf"
 *             originalFileName: "PT001_model.gltf"
 *             filePath: "/uploads/models/instruments/"
 *             fileUrl: "https://api.example.com/models/pressure_transmitter_PT001.gltf"
 *             fileSize: 2048576
 *             format: "GLTF"
 *             metadata:
 *               title: "PT-001 Interactive 3D Model"
 *               description: "High-fidelity 3D model for training purposes"
 *               category: "training"
 *     responses:
 *       200:
 *         description: 3D model upload initiated successfully
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
 *                     visualizationId:
 *                       type: string
 *                     processingStatus:
 *                       type: string
 *                     estimatedProcessingTime:
 *                       type: string
 *                     modelInfo:
 *                       type: object
 *       400:
 *         description: Bad Request - Invalid file format or size
 *       404:
 *         description: Instrument not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/instruments/:id/upload", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), upload3DModel);

/**
 * @swagger
 * /api/3d/instruments/{id}/status:
 *   get:
 *     tags:
 *       - 3D Model Management
 *     summary: Get 3D model processing status
 *     description: Check the current processing status, validation results, and readiness of a 3D model
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *     responses:
 *       200:
 *         description: 3D model status retrieved successfully
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
 *                     modelId:
 *                       type: string
 *                     processing:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [pending, processing, optimizing, ready, failed]
 *                         progress:
 *                           type: number
 *                           minimum: 0
 *                           maximum: 100
 *                     validation:
 *                       type: object
 *                       properties:
 *                         isValid:
 *                           type: boolean
 *                         statistics:
 *                           type: object
 *                     gltfProperties:
 *                       type: object
 *                       properties:
 *                         hasAnimations:
 *                           type: boolean
 *                         hasMaterials:
 *                           type: boolean
 *                         hasTextures:
 *                           type: boolean
 *                     isReady:
 *                       type: boolean
 *                     canVisualize:
 *                       type: boolean
 *       404:
 *         description: 3D model not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/instruments/:id/status", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), get3DModelStatus);

/**
 * @swagger
 * /api/3d/instruments/{id}/config:
 *   get:
 *     tags:
 *       - 3D Model Management
 *     summary: Get 3D model loading configuration for frontend
 *     description: Get comprehensive loading configuration including GLTF-specific instructions, optimization settings, and Three.js loader setup
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Instrument ID (Numeric)
 *       - in: query
 *         name: optimized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Enable optimization settings
 *     responses:
 *       200:
 *         description: 3D model loading configuration retrieved successfully
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
 *                     modelUrl:
 *                       type: string
 *                       description: Direct URL to the 3D model file
 *                     format:
 *                       type: string
 *                       description: Model format (GLTF, GLB, etc.)
 *                     loadingOptions:
 *                       type: object
 *                       properties:
 *                         crossOrigin:
 *                           type: string
 *                         dracoDecoderPath:
 *                           type: string
 *                         ktx2DecoderPath:
 *                           type: string
 *                     gltfInstructions:
 *                       type: object
 *                       properties:
 *                         loaderSetup:
 *                           type: object
 *                           properties:
 *                             dracoLoader:
 *                               type: boolean
 *                             ktx2Loader:
 *                               type: boolean
 *                             meshoptDecoder:
 *                               type: boolean
 *                         hints:
 *                           type: object
 *                           properties:
 *                             hasAnimations:
 *                               type: boolean
 *                             hasMaterials:
 *                               type: boolean
 *                             hasTextures:
 *                               type: boolean
 *                             estimatedLoadTime:
 *                               type: string
 *                         sceneSetup:
 *                           type: object
 *                           properties:
 *                             boundingBox:
 *                               type: object
 *                             center:
 *                               type: object
 *                             recommendedCameraDistance:
 *                               type: number
 *                     optimizations:
 *                       type: object
 *                       properties:
 *                         levelOfDetail:
 *                           type: boolean
 *                         frustumCulling:
 *                           type: boolean
 *                         enableShadows:
 *                           type: boolean
 *       400:
 *         description: 3D model not ready for loading
 *       404:
 *         description: 3D model not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/instruments/:id/config", authenticateToken, requireRole(["engineer", "supervisor", "admin"]), get3DModelLoadingConfig);

export default router;
