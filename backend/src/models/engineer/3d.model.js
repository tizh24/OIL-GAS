import mongoose from "mongoose";

// 3D Visualization Settings Schema
const threeDVisualizationSchema = new mongoose.Schema({
    instrumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instrument",
        required: true,
        index: true
    },

    // 3D Model Configuration
    model: {
        fileName: {
            type: String,
            required: true
        },
        originalFileName: {
            type: String,
            required: true
        },
        filePath: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String, // Full URL for frontend access
        },
        fileSize: {
            type: Number,
            required: true
        },
        format: {
            type: String,
            enum: ["FBX", "OBJ", "GLTF", "GLB", "3DS", "STL", "USD", "COLLADA"],
            required: true
        },
        // GLTF/GLB Specific Properties
        gltfProperties: {
            scenes: [{
                name: String,
                nodes: [String]
            }],
            animations: [{
                name: String,
                duration: Number,
                channels: Number
            }],
            materials: [{
                name: String,
                type: String,
                properties: mongoose.Schema.Types.Mixed
            }],
            textures: [{
                name: String,
                uri: String,
                mimeType: String,
                size: Number
            }],
            meshes: [{
                name: String,
                primitives: Number,
                vertices: Number,
                triangles: Number
            }],
            extensionsUsed: [String],
            extensionsRequired: [String],
            hasAnimations: { type: Boolean, default: false },
            hasMaterials: { type: Boolean, default: false },
            hasTextures: { type: Boolean, default: false }
        },
        // Model Processing Status
        processing: {
            status: {
                type: String,
                enum: ["pending", "processing", "optimizing", "ready", "failed"],
                default: "pending"
            },
            progress: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },
            startedAt: Date,
            completedAt: Date,
            errorMessage: String,
            optimizations: [{
                type: {
                    type: String,
                    enum: ["compression", "decimation", "texture-optimization", "material-merging"]
                },
                applied: Boolean,
                settings: mongoose.Schema.Types.Mixed,
                sizeReduction: Number
            }]
        },
        // Model Validation
        validation: {
            isValid: { type: Boolean, default: false },
            validatedAt: Date,
            issues: [{
                type: {
                    type: String,
                    enum: ["warning", "error", "info"]
                },
                code: String,
                message: String,
                severity: {
                    type: String,
                    enum: ["low", "medium", "high", "critical"]
                }
            }],
            statistics: {
                totalVertices: Number,
                totalTriangles: Number,
                totalMaterials: Number,
                totalTextures: Number,
                boundingBox: {
                    min: { x: Number, y: Number, z: Number },
                    max: { x: Number, y: Number, z: Number }
                },
                center: { x: Number, y: Number, z: Number },
                scale: { x: Number, y: Number, z: Number }
            }
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        checksum: String,
        version: {
            type: String,
            default: "1.0.0"
        },
        // Backup and Versioning
        previousVersions: [{
            version: String,
            fileName: String,
            filePath: String,
            uploadedAt: Date,
            changes: String
        }]
    },

    // Visualization Settings
    visualization: {
        // Camera Settings
        camera: {
            position: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 },
                z: { type: Number, default: 5 }
            },
            rotation: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 },
                z: { type: Number, default: 0 }
            },
            fov: {
                type: Number,
                default: 75,
                min: 10,
                max: 180
            },
            near: {
                type: Number,
                default: 0.1,
                min: 0.01
            },
            far: {
                type: Number,
                default: 1000,
                min: 1
            }
        },

        // Lighting Configuration
        lighting: {
            ambient: {
                color: {
                    type: String,
                    default: "#404040"
                },
                intensity: {
                    type: Number,
                    default: 0.4,
                    min: 0,
                    max: 1
                }
            },
            directional: {
                color: {
                    type: String,
                    default: "#ffffff"
                },
                intensity: {
                    type: Number,
                    default: 1,
                    min: 0,
                    max: 2
                },
                position: {
                    x: { type: Number, default: 5 },
                    y: { type: Number, default: 10 },
                    z: { type: Number, default: 7.5 }
                },
                castShadow: {
                    type: Boolean,
                    default: true
                }
            },
            point: [{
                color: {
                    type: String,
                    default: "#ffffff"
                },
                intensity: {
                    type: Number,
                    default: 0.8,
                    min: 0,
                    max: 2
                },
                position: {
                    x: { type: Number, default: 0 },
                    y: { type: Number, default: 5 },
                    z: { type: Number, default: 0 }
                },
                distance: {
                    type: Number,
                    default: 100
                },
                decay: {
                    type: Number,
                    default: 1
                }
            }]
        },

        // Control Settings
        controls: {
            enableZoom: {
                type: Boolean,
                default: true
            },
            enableRotate: {
                type: Boolean,
                default: true
            },
            enablePan: {
                type: Boolean,
                default: true
            },
            autoRotate: {
                type: Boolean,
                default: false
            },
            autoRotateSpeed: {
                type: Number,
                default: 2.0
            },
            zoomSpeed: {
                type: Number,
                default: 1.0
            },
            rotateSpeed: {
                type: Number,
                default: 1.0
            },
            panSpeed: {
                type: Number,
                default: 0.8
            },
            minDistance: {
                type: Number,
                default: 1
            },
            maxDistance: {
                type: Number,
                default: 100
            },
            minPolarAngle: {
                type: Number,
                default: 0
            },
            maxPolarAngle: {
                type: Number,
                default: Math.PI
            }
        },

        // Rendering Options
        rendering: {
            backgroundColor: {
                type: String,
                default: "#f0f0f0"
            },
            wireframe: {
                type: Boolean,
                default: false
            },
            shadows: {
                type: Boolean,
                default: true
            },
            antialias: {
                type: Boolean,
                default: true
            },
            pixelRatio: {
                type: Number,
                default: 1,
                min: 0.5,
                max: 2
            },
            quality: {
                type: String,
                enum: ["low", "medium", "high", "ultra"],
                default: "medium"
            }
        }
    },

    // Interactive Elements
    interactiveElements: [{
        elementId: String,
        type: {
            type: String,
            enum: ["hotspot", "animation", "measurement", "annotation", "sensor"]
        },
        position: {
            x: Number,
            y: Number,
            z: Number
        },
        description: String,
        data: mongoose.Schema.Types.Mixed,
        visible: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Training & Analysis Data
    trainingData: {
        sessions: [{
            sessionId: String,
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            startTime: {
                type: Date,
                default: Date.now
            },
            endTime: Date,
            duration: Number, // in seconds
            interactions: [{
                action: String,
                timestamp: Date,
                data: mongoose.Schema.Types.Mixed
            }],
            score: Number,
            completionRate: Number,
            feedback: String
        }],
        analytics: {
            totalSessions: {
                type: Number,
                default: 0
            },
            averageSessionTime: Number,
            mostInteractedElements: [String],
            commonIssues: [String],
            learningProgress: mongoose.Schema.Types.Mixed
        }
    },

    // Metadata
    metadata: {
        title: String,
        description: String,
        tags: [String],
        category: {
            type: String,
            enum: ["training", "maintenance", "inspection", "simulation", "documentation"]
        },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "expert"],
            default: "intermediate"
        },
        estimatedTime: Number, // in minutes
        prerequisites: [String]
    },

    // Version Control
    version: {
        type: String,
        default: "1.0.0"
    },
    changelog: [{
        version: String,
        date: {
            type: Date,
            default: Date.now
        },
        changes: [String],
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],

    // Status
    status: {
        type: String,
        enum: ["draft", "review", "published", "archived"],
        default: "draft"
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    accessCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
threeDVisualizationSchema.index({ instrumentId: 1, status: 1 });
threeDVisualizationSchema.index({ "metadata.category": 1 });
threeDVisualizationSchema.index({ "metadata.tags": 1 });
threeDVisualizationSchema.index({ createdBy: 1 });
threeDVisualizationSchema.index({ lastAccessed: -1 });

// Virtual for file URL
threeDVisualizationSchema.virtual('modelUrl').get(function () {
    if (this.model && this.model.filePath && this.model.fileName) {
        return `${this.model.filePath}${this.model.fileName}`;
    }
    return null;
});

// Virtual for session statistics
threeDVisualizationSchema.virtual('sessionStats').get(function () {
    if (!this.trainingData || !this.trainingData.sessions) return null;

    const sessions = this.trainingData.sessions;
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.endTime).length;
    const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions || 0;

    return {
        total: totalSessions,
        completed: completedSessions,
        completionRate: totalSessions ? (completedSessions / totalSessions) * 100 : 0,
        averageScore: Math.round(avgScore * 100) / 100
    };
});

// Static method to find visualization by instrument
threeDVisualizationSchema.statics.findByInstrument = function (instrumentId) {
    return this.findOne({
        instrumentId,
        status: { $in: ["published", "review"] },
        isActive: true
    })
        .populate('instrumentId', 'name type model location status')
        .populate('createdBy updatedBy', 'name email department');
};

// Static method to create 3D model from upload
threeDVisualizationSchema.statics.createFromUpload = async function (uploadData) {
    const { instrumentId, file, metadata, uploadedBy } = uploadData;

    const visualization = await this.create({
        instrumentId,
        model: {
            fileName: file.fileName,
            originalFileName: file.originalName,
            filePath: file.path,
            fileUrl: file.url,
            fileSize: file.size,
            format: file.format.toUpperCase(),
            processing: {
                status: "pending",
                startedAt: new Date()
            }
        },
        metadata: metadata || {
            title: `3D Model for Instrument ${instrumentId}`,
            category: "training"
        },
        createdBy: uploadedBy,
        status: "draft"
    });

    // Start async processing
    this.processModel(visualization._id);

    return visualization;
};

// Static method to process uploaded model
threeDVisualizationSchema.statics.processModel = async function (visualizationId) {
    try {
        const visualization = await this.findById(visualizationId);
        if (!visualization) return;

        visualization.model.processing.status = "processing";
        visualization.model.processing.progress = 10;
        await visualization.save();

        const gltfData = await this.parseGLTFModel(visualization.model.filePath);

        visualization.model.gltfProperties = gltfData.properties;
        visualization.model.validation = gltfData.validation;
        visualization.model.processing.progress = 70;
        await visualization.save();

        if (visualization.model.fileSize > 50 * 1024 * 1024) {
            await this.optimizeModel(visualization);
        }

        visualization.model.processing.status = "ready";
        visualization.model.processing.progress = 100;
        visualization.model.processing.completedAt = new Date();
        visualization.model.validation.isValid = true;
        visualization.model.validation.validatedAt = new Date();
        visualization.status = "published";

        await visualization.save();

    } catch (error) {
        await this.updateOne(
            { _id: visualizationId },
            {
                "model.processing.status": "failed",
                "model.processing.errorMessage": error.message,
                "model.processing.completedAt": new Date()
            }
        );
    }
};

// Static method to parse GLTF model
threeDVisualizationSchema.statics.parseGLTFModel = async function (filePath) {
    return {
        properties: {
            scenes: [{ name: "Scene", nodes: ["RootNode"] }],
            animations: [],
            materials: [{ name: "DefaultMaterial", type: "PBR", properties: {} }],
            textures: [],
            meshes: [{ name: "InstrumentMesh", primitives: 1, vertices: 1200, triangles: 800 }],
            extensionsUsed: ["KHR_materials_pbrSpecularGlossiness"],
            extensionsRequired: [],
            hasAnimations: false,
            hasMaterials: true,
            hasTextures: false
        },
        validation: {
            isValid: true,
            issues: [],
            statistics: {
                totalVertices: 1200,
                totalTriangles: 800,
                totalMaterials: 1,
                totalTextures: 0,
                boundingBox: {
                    min: { x: -1, y: -1, z: -1 },
                    max: { x: 1, y: 1, z: 1 }
                },
                center: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            }
        }
    };
};

// Static method to optimize model
threeDVisualizationSchema.statics.optimizeModel = async function (visualization) {
    // Mock optimization - in real implementation use gltf-pipeline or similar
    const optimizations = [
        {
            type: "compression",
            applied: true,
            settings: { level: 6 },
            sizeReduction: 0.3 // 30% reduction
        }
    ];

    visualization.model.processing.optimizations = optimizations;
    visualization.model.fileSize = Math.floor(visualization.model.fileSize * 0.7); // Simulated compression

    await visualization.save();
};

// Instance method to create new version
threeDVisualizationSchema.methods.createNewVersion = async function (newFileData, changes) {
    // Backup current version
    this.model.previousVersions.push({
        version: this.model.version,
        fileName: this.model.fileName,
        filePath: this.model.filePath,
        uploadedAt: this.model.uploadedAt,
        changes: changes || "Model update"
    });

    // Update to new version
    const versionParts = this.model.version.split('.');
    versionParts[1] = String(parseInt(versionParts[1]) + 1);

    this.model.version = versionParts.join('.');
    this.model.fileName = newFileData.fileName;
    this.model.filePath = newFileData.filePath;
    this.model.fileUrl = newFileData.fileUrl;
    this.model.fileSize = newFileData.fileSize;
    this.model.uploadedAt = new Date();
    this.model.processing.status = "pending";

    await this.save();

    // Process new version
    await this.constructor.processModel(this._id);

    return this;
};

// Instance method to get model loading configuration for frontend
threeDVisualizationSchema.methods.getLoadingConfig = function () {
    return {
        modelUrl: this.model.fileUrl || `${this.model.filePath}${this.model.fileName}`,
        format: this.model.format,
        processing: this.model.processing,
        validation: this.model.validation,
        gltfProperties: this.model.gltfProperties,
        visualization: this.visualization,
        loadingOptions: {
            crossOrigin: "anonymous",
            withCredentials: false,
            dracoDecoderPath: "/js/libs/draco/",
            ktx2DecoderPath: "/js/libs/basis/",
        },
        optimizations: {
            useInstancedMesh: this.model.gltfProperties?.meshes?.length > 10,
            enableShadows: this.visualization.rendering.shadows,
            levelOfDetail: this.model.fileSize > 10 * 1024 * 1024,
            frustumCulling: true,
            occlusion: true
        }
    };
};

// Instance method to update access tracking
threeDVisualizationSchema.methods.trackAccess = function () {
    this.accessCount += 1;
    this.lastAccessed = new Date();
    return this.save();
};

// Instance method to add training session
threeDVisualizationSchema.methods.addTrainingSession = function (sessionData) {
    if (!this.trainingData) {
        this.trainingData = { sessions: [], analytics: {} };
    }
    if (!this.trainingData.sessions) {
        this.trainingData.sessions = [];
    }

    this.trainingData.sessions.push(sessionData);
    this.trainingData.analytics.totalSessions = this.trainingData.sessions.length;

    return this.save();
};

// Pre-save middleware to update version
threeDVisualizationSchema.pre('save', function (next) {
    if (this.isModified('visualization') || this.isModified('model')) {
        // Update version when major changes occur
        const versionParts = this.version.split('.');
        versionParts[2] = String(parseInt(versionParts[2]) + 1);
        this.version = versionParts.join('.');
    }
    next();
});

export default mongoose.model("ThreeDVisualization", threeDVisualizationSchema);