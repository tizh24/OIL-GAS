import ThreeDVisualization from "../../models/engineer/3d.model.js";
import Instrument from "../../models/engineer/instrument.model.js";
import { success, error } from "../../utils/response.js";
import mongoose from "mongoose";

// 4.1 Visualize 3D Instrument - GET /3d/instruments/{id}/visualize
export const visualize3DInstrument = async (req, res) => {
    try {
        const { id } = req.params;
        const { quality, lighting, controls } = req.query;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return error(res, 400, "Invalid instrument ID");
        }

        // Find the instrument first
        const instrument = await Instrument.findOne({
            _id: id,
            deletedAt: null
        });

        if (!instrument) {
            return error(res, 404, "Instrument not found");
        }

        // Find or create 3D visualization configuration
        let visualization = await ThreeDVisualization.findByInstrument(id);

        if (!visualization) {
            // Create default visualization if none exists
            visualization = await ThreeDVisualization.create({
                instrumentId: id,
                model: {
                    fileName: `${instrument.name.replace(/\s+/g, '_')}_model.gltf`,
                    filePath: `/models/instruments/${instrument.type}/`,
                    fileSize: 0,
                    format: "GLTF"
                },
                metadata: {
                    title: `${instrument.name} 3D Visualization`,
                    description: `Interactive 3D model for ${instrument.name}`,
                    category: "training",
                    tags: [instrument.type, instrument.manufacturer, "3d-model"]
                },
                createdBy: req.user.userId,
                status: "published"
            });
        }

        // Apply runtime overrides from query parameters
        const config = JSON.parse(JSON.stringify(visualization.toObject()));

        if (quality) {
            config.visualization.rendering.quality = quality;
        }

        if (lighting === 'enhanced') {
            config.visualization.lighting.ambient.intensity = 0.6;
            config.visualization.lighting.directional.intensity = 1.2;
        }

        if (controls) {
            const controlSettings = JSON.parse(controls);
            Object.assign(config.visualization.controls, controlSettings);
        }

        // Track access
        await visualization.trackAccess();

        // Get instrument real-time data for interactive elements
        const realTimeData = {
            operationalParameters: instrument.operationalParameters,
            status: instrument.status,
            lastReading: instrument.operationalParameters?.lastReading || null,
            alarmStatus: calculateAlarmStatus(instrument),
            performance: calculatePerformanceMetrics(instrument)
        };

        return success(res, "3D visualization data retrieved successfully", {
            visualization: config,
            instrument: {
                id: instrument._id,
                name: instrument.name,
                type: instrument.type,
                model: instrument.model,
                location: instrument.location,
                status: instrument.status
            },
            realTimeData,
            interactionGuide: {
                zoom: "Mouse wheel or pinch gesture",
                rotate: "Left mouse button + drag",
                pan: "Right mouse button + drag",
                hotspots: "Click on highlighted areas for details"
            }
        });

    } catch (err) {
        return error(res, 500, "Failed to load 3D visualization", err.message);
    }
};

// 4.2 View Equipment Control Information - GET /control/equipment/{id}
export const getEquipmentControlInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeHistory = false } = req.query;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return error(res, 400, "Invalid equipment ID");
        }

        // Find equipment (could be instrument or other equipment)
        const equipment = await Instrument.findOne({
            _id: id,
            deletedAt: null
        }).populate('assignedEngineers.engineer', 'name email department phone');

        if (!equipment) {
            return error(res, 404, "Equipment not found");
        }

        // Operational Settings
        const operationalSettings = {
            setPoints: {
                primary: equipment.operationalParameters?.setPoint || null,
                secondary: equipment.operationalParameters?.secondarySetPoint || null,
                mode: equipment.operationalParameters?.operationMode || "auto"
            },
            controlLoop: {
                enabled: equipment.operationalParameters?.controlEnabled || false,
                pid: equipment.operationalParameters?.pidSettings || {
                    proportional: 1.0,
                    integral: 0.1,
                    derivative: 0.05
                },
                tuning: equipment.operationalParameters?.tuningParameters || "default"
            },
            safetyLimits: {
                high: equipment.operationalParameters?.alarmLimits?.high || null,
                low: equipment.operationalParameters?.alarmLimits?.low || null,
                emergency: equipment.operationalParameters?.emergencyLimits || null
            },
            communication: {
                protocol: equipment.specifications?.communication?.protocol || "Modbus",
                address: equipment.specifications?.communication?.address || "001",
                baudRate: equipment.specifications?.communication?.baudRate || 9600,
                status: "connected" // This would come from real system
            }
        };

        // Current Status & Values
        const currentStatus = {
            primaryValue: {
                value: equipment.operationalParameters?.currentValue || 0,
                unit: equipment.specifications?.range?.unit || "units",
                quality: equipment.operationalParameters?.lastReading?.quality || "good",
                timestamp: equipment.operationalParameters?.lastReading?.timestamp || new Date()
            },
            systemHealth: {
                overall: calculateSystemHealth(equipment),
                calibrationStatus: calculateCalibrationStatus(equipment),
                maintenanceStatus: calculateMaintenanceStatus(equipment),
                communicationStatus: "online" // Would come from real system
            },
            performance: {
                accuracy: calculateCurrentAccuracy(equipment),
                stability: calculateStability(equipment),
                responseTime: equipment.specifications?.responseTime?.value || null,
                uptime: calculateUptime(equipment)
            }
        };

        // Alarms & Alerts
        const alarmsAndAlerts = {
            active: generateActiveAlarms(equipment),
            recent: includeHistory ? await getRecentAlarms(id) : [],
            configuration: {
                enableAudible: true,
                enableEmail: true,
                enableSMS: false,
                escalationTime: 300, // seconds
                acknowledgeRequired: true
            },
            priority: {
                critical: 0,
                high: 0,
                medium: 1,
                low: 0
            }
        };

        // Calculate alarm priorities
        alarmsAndAlerts.active.forEach(alarm => {
            alarmsAndAlerts.priority[alarm.priority]++;
        });

        // Control Actions Available
        const availableActions = {
            remote: {
                setPointAdjustment: hasPermission(req.user, 'setpoint_adjust'),
                modeChange: hasPermission(req.user, 'mode_change'),
                calibration: hasPermission(req.user, 'calibration'),
                reset: hasPermission(req.user, 'reset'),
                maintenance: hasPermission(req.user, 'maintenance')
            },
            local: {
                required: equipment.specifications?.localControlRequired || false,
                keySwitch: equipment.specifications?.keySwitchPosition || "remote"
            }
        };

        // Historical Data (if requested)
        let historicalData = null;
        if (includeHistory === 'true') {
            historicalData = await getHistoricalControlData(id);
        }

        return success(res, "Equipment control information retrieved successfully", {
            equipment: {
                id: equipment._id,
                name: equipment.name,
                type: equipment.type,
                model: equipment.model,
                location: equipment.location,
                serialNumber: equipment.serial,
                manufacturer: equipment.manufacturer
            },
            operationalSettings,
            currentStatus,
            alarmsAndAlerts,
            availableActions,
            assignedEngineers: equipment.assignedEngineers,
            lastUpdated: new Date(),
            ...(historicalData && { historicalData })
        });

    } catch (err) {
        return error(res, 500, "Failed to retrieve equipment control information", err.message);
    }
};

// Update 3D visualization settings
export const update3DVisualizationSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { visualization, interactiveElements, metadata } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return error(res, 400, "Invalid instrument ID");
        }

        // Find existing visualization
        let threeDConfig = await ThreeDVisualization.findByInstrument(id);

        if (!threeDConfig) {
            return error(res, 404, "3D visualization not found");
        }

        // Update fields if provided
        if (visualization) {
            threeDConfig.visualization = { ...threeDConfig.visualization, ...visualization };
        }

        if (interactiveElements) {
            threeDConfig.interactiveElements = interactiveElements;
        }

        if (metadata) {
            threeDConfig.metadata = { ...threeDConfig.metadata, ...metadata };
        }

        threeDConfig.updatedBy = req.user.userId;
        await threeDConfig.save();

        return success(res, "3D visualization settings updated successfully", threeDConfig);

    } catch (err) {
        return error(res, 500, "Failed to update 3D visualization settings", err.message);
    }
};

// Add training session data
export const addTrainingSession = async (req, res) => {
    try {
        const { id } = req.params;
        const sessionData = {
            ...req.body,
            userId: req.user.userId,
            sessionId: `session_${Date.now()}_${req.user.userId}`
        };

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return error(res, 400, "Invalid instrument ID");
        }

        const visualization = await ThreeDVisualization.findByInstrument(id);
        if (!visualization) {
            return error(res, 404, "3D visualization not found");
        }

        await visualization.addTrainingSession(sessionData);

        return success(res, "Training session recorded successfully", {
            sessionId: sessionData.sessionId,
            stats: visualization.sessionStats
        });

    } catch (err) {
        return error(res, 500, "Failed to record training session", err.message);
    }
};

// Get 3D Model Processing Status
export const get3DModelStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return error(res, 400, "Invalid instrument ID");
        }

        const visualization = await ThreeDVisualization.findByInstrument(id);

        if (!visualization) {
            return error(res, 404, "3D model not found");
        }

        const status = {
            modelId: visualization._id,
            instrumentId: visualization.instrumentId,
            processing: visualization.model.processing,
            validation: visualization.model.validation,
            modelInfo: {
                fileName: visualization.model.fileName,
                format: visualization.model.format,
                fileSize: visualization.model.fileSize,
                version: visualization.model.version,
                uploadedAt: visualization.model.uploadedAt
            },
            gltfProperties: visualization.model.gltfProperties,
            isReady: visualization.model.processing.status === "ready",
            canVisualize: visualization.model.validation.isValid && visualization.status === "published"
        };

        return success(res, "3D model status retrieved successfully", status);

    } catch (err) {
        return error(res, 500, "Failed to get 3D model status", err.message);
    }
};

// Get 3D Model Loading Configuration for Frontend
export const get3DModelLoadingConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { optimized = true } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return error(res, 400, "Invalid instrument ID");
        }

        const visualization = await ThreeDVisualization.findByInstrument(id);

        if (!visualization) {
            return error(res, 404, "3D model not found");
        }

        if (visualization.model.processing.status !== "ready") {
            return error(res, 400, "3D model is not ready for loading", {
                status: visualization.model.processing.status,
                progress: visualization.model.processing.progress
            });
        }

        // Get loading configuration
        const loadingConfig = visualization.getLoadingConfig();

        // Add optimization settings based on query
        if (optimized === 'false') {
            loadingConfig.optimizations = {
                ...loadingConfig.optimizations,
                levelOfDetail: false,
                frustumCulling: false,
                occlusion: false
            };
        }

        // Add GLTF-specific loading instructions
        if (visualization.model.format === "GLTF" || visualization.model.format === "GLB") {
            loadingConfig.gltfInstructions = {
                loaderSetup: {
                    dracoLoader: visualization.model.gltfProperties?.extensionsUsed?.includes("KHR_draco_mesh_compression"),
                    ktx2Loader: visualization.model.gltfProperties?.extensionsUsed?.includes("KHR_texture_basisu"),
                    meshoptDecoder: visualization.model.gltfProperties?.extensionsUsed?.includes("EXT_meshopt_compression")
                },
                hints: {
                    hasAnimations: visualization.model.gltfProperties?.hasAnimations,
                    hasMaterials: visualization.model.gltfProperties?.hasMaterials,
                    hasTextures: visualization.model.gltfProperties?.hasTextures,
                    triangleCount: visualization.model.validation?.statistics?.totalTriangles,
                    estimatedLoadTime: calculateLoadTime(visualization.model.fileSize)
                },
                sceneSetup: {
                    boundingBox: visualization.model.validation?.statistics?.boundingBox,
                    center: visualization.model.validation?.statistics?.center,
                    recommendedCameraDistance: calculateCameraDistance(visualization.model.validation?.statistics?.boundingBox),
                    lightingRecommendations: getLightingRecommendations(visualization.model.gltfProperties)
                }
            };
        }

        return success(res, "3D model loading configuration retrieved successfully", loadingConfig);

    } catch (err) {
        return error(res, 500, "Failed to get 3D model loading config", err.message);
    }
};

// Helper Functions
const calculateAlarmStatus = (instrument) => {
    const currentValue = instrument.operationalParameters?.currentValue || 0;
    const limits = instrument.operationalParameters?.alarmLimits;

    if (!limits) return "unknown";

    if (currentValue > limits.high || currentValue < limits.low) {
        return "alarm";
    } else if (currentValue > limits.high * 0.9 || currentValue < limits.low * 1.1) {
        return "warning";
    }
    return "normal";
};

const calculatePerformanceMetrics = (instrument) => {
    // Mock performance calculation - in real system this would use historical data
    return {
        efficiency: Math.random() * 20 + 80, // 80-100%
        reliability: Math.random() * 10 + 90, // 90-100%
        availability: Math.random() * 5 + 95  // 95-100%
    };
};

const calculateSystemHealth = (equipment) => {
    const factors = [
        equipment.status === 'operational' ? 25 : 0,
        equipment.operationalParameters?.lastReading ? 25 : 0,
        calculateCalibrationStatus(equipment) === 'current' ? 25 : 0,
        calculateMaintenanceStatus(equipment) === 'scheduled' ? 25 : 0
    ];

    const health = factors.reduce((sum, factor) => sum + factor, 0);

    if (health >= 90) return "excellent";
    if (health >= 75) return "good";
    if (health >= 50) return "fair";
    return "poor";
};

const calculateCalibrationStatus = (equipment) => {
    const lastCalibration = equipment.lastCalibration?.date;
    if (!lastCalibration) return "unknown";

    const daysSince = (Date.now() - new Date(lastCalibration)) / (1000 * 60 * 60 * 24);
    const calibrationInterval = 365; // Default 1 year

    if (daysSince > calibrationInterval) return "overdue";
    if (daysSince > calibrationInterval * 0.9) return "due-soon";
    return "current";
};

const calculateMaintenanceStatus = (equipment) => {
    const nextMaintenance = equipment.lastMaintenance?.nextDue;
    if (!nextMaintenance) return "unknown";

    const daysUntil = (new Date(nextMaintenance) - Date.now()) / (1000 * 60 * 60 * 24);

    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 7) return "due-soon";
    return "scheduled";
};

const calculateCurrentAccuracy = (equipment) => {
    const specAccuracy = equipment.specifications?.accuracy?.value || 1.0;
    // Mock calculation - in real system this would analyze recent readings
    return specAccuracy * (0.8 + Math.random() * 0.4); // 80-120% of spec accuracy
};

const calculateStability = (equipment) => {
    // Mock stability calculation - in real system analyze variance in readings
    return Math.random() * 10 + 90; // 90-100% stability
};

const calculateUptime = (equipment) => {
    // Mock uptime calculation - in real system track actual operational time
    return Math.random() * 5 + 95; // 95-100% uptime
};

const generateActiveAlarms = (equipment) => {
    const alarms = [];
    const currentValue = equipment.operationalParameters?.currentValue || 0;
    const limits = equipment.operationalParameters?.alarmLimits;

    if (limits) {
        if (currentValue > limits.high) {
            alarms.push({
                id: `alarm_${Date.now()}_1`,
                type: "high_limit",
                message: `Value ${currentValue} exceeds high limit ${limits.high}`,
                priority: "high",
                timestamp: new Date(),
                acknowledged: false
            });
        }

        if (currentValue < limits.low) {
            alarms.push({
                id: `alarm_${Date.now()}_2`,
                type: "low_limit",
                message: `Value ${currentValue} below low limit ${limits.low}`,
                priority: "high",
                timestamp: new Date(),
                acknowledged: false
            });
        }
    }

    // Add calibration overdue alarm
    if (calculateCalibrationStatus(equipment) === "overdue") {
        alarms.push({
            id: `alarm_${Date.now()}_3`,
            type: "calibration_overdue",
            message: "Equipment calibration is overdue",
            priority: "medium",
            timestamp: new Date(),
            acknowledged: false
        });
    }

    return alarms;
};

const getRecentAlarms = async (equipmentId) => {
    // Mock recent alarms - in real system query alarm history database
    return [
        {
            id: "alarm_hist_1",
            type: "maintenance_reminder",
            message: "Scheduled maintenance due in 3 days",
            priority: "low",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            acknowledged: true,
            resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
    ];
};

const hasPermission = (user, action) => {
    // Mock permission check - in real system check user roles and permissions
    const permissions = {
        'setpoint_adjust': ['engineer', 'supervisor', 'admin'],
        'mode_change': ['supervisor', 'admin'],
        'calibration': ['engineer', 'supervisor', 'admin'],
        'reset': ['supervisor', 'admin'],
        'maintenance': ['engineer', 'supervisor', 'admin']
    };

    return permissions[action]?.includes(user.role) || false;
};

const getHistoricalControlData = async (equipmentId) => {
    // Mock historical data - in real system query time-series database
    const now = Date.now();
    const data = [];

    for (let i = 23; i >= 0; i--) {
        data.push({
            timestamp: new Date(now - i * 60 * 60 * 1000),
            value: 450 + Math.sin(i * 0.5) * 50 + Math.random() * 20,
            setPoint: 500,
            alarms: i % 8 === 0 ? ["high_warning"] : []
        });
    }

    return {
        timeRange: "24h",
        interval: "1h",
        data
    };
};

const calculateLoadTime = (fileSize) => {
    const mbSize = fileSize / (1024 * 1024);
    if (mbSize < 1) return "< 1 second";
    if (mbSize < 5) return "1-3 seconds";
    if (mbSize < 20) return "3-8 seconds";
    return "8+ seconds";
};

const calculateCameraDistance = (boundingBox) => {
    if (!boundingBox) return 5;

    const size = Math.max(
        boundingBox.max.x - boundingBox.min.x,
        boundingBox.max.y - boundingBox.min.y,
        boundingBox.max.z - boundingBox.min.z
    );

    return size * 2.5;
};

const getLightingRecommendations = (gltfProperties) => {
    const recommendations = {
        ambient: { intensity: 0.4 },
        directional: { intensity: 1.0 }
    };

    if (gltfProperties?.hasMaterials) {
        recommendations.directional.intensity = 1.2;
        recommendations.ambient.intensity = 0.3;
    }

    if (gltfProperties?.hasTextures) {
        recommendations.directional.castShadow = true;
        recommendations.point = [{ intensity: 0.5 }];
    }

    return recommendations;
};

// Upload 3D Model for Instrument
export const upload3DModel = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fileName,
            originalFileName,
            filePath,
            fileUrl,
            fileSize,
            format,
            metadata
        } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return error(res, 400, "Invalid instrument ID");
        }

        // Validate required fields
        if (!fileName || !filePath || !fileSize || !format) {
            return error(res, 400, "Missing required file information");
        }

        // Check if instrument exists
        const instrument = await Instrument.findOne({
            _id: id,
            deletedAt: null
        });

        if (!instrument) {
            return error(res, 404, "Instrument not found");
        }

        // Validate file format
        const supportedFormats = ["GLTF", "GLB", "FBX", "OBJ", "3DS", "STL"];
        if (!supportedFormats.includes(format.toUpperCase())) {
            return error(res, 400, `Unsupported format. Supported: ${supportedFormats.join(", ")}`);
        }

        // Check file size limit (100MB)
        if (fileSize > 100 * 1024 * 1024) {
            return error(res, 400, "File size exceeds 100MB limit");
        }

        // Check if 3D model already exists
        let visualization = await ThreeDVisualization.findByInstrument(id);

        if (visualization) {
            // Create new version of existing model
            const newFileData = {
                fileName,
                filePath,
                fileUrl,
                fileSize
            };

            visualization = await visualization.createNewVersion(
                newFileData,
                "Model updated via upload"
            );
        } else {
            // Create new 3D visualization
            visualization = await ThreeDVisualization.createFromUpload({
                instrumentId: id,
                file: {
                    fileName,
                    originalName: originalFileName,
                    path: filePath,
                    url: fileUrl,
                    size: fileSize,
                    format
                },
                metadata,
                uploadedBy: req.user.userId
            });
        }

        return success(res, "3D model upload initiated successfully", {
            visualizationId: visualization._id,
            processingStatus: visualization.model.processing.status,
            estimatedProcessingTime: "2-5 minutes",
            modelInfo: {
                fileName: visualization.model.fileName,
                format: visualization.model.format,
                size: visualization.model.fileSize,
                version: visualization.model.version
            }
        });

    } catch (err) {
        return error(res, 500, "Failed to upload 3D model", err.message);
    }
};