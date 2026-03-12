import mongoose from "mongoose";
import Counter from "../counter.model.js";

const reportSchema = new mongoose.Schema({
    reportCode: {
        type: String,
        unique: true
    },

    // Basic Information
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: [200, 'Title cannot exceed 200 characters']
    },

    type: {
        type: String,
        required: true,
        enum: ['kpi', 'maintenance', 'incident', 'sensor', 'equipment', 'custom'],
        index: true
    },

    category: {
        type: String,
        required: true,
        enum: ['operational', 'technical', 'safety', 'environmental', 'financial', 'regulatory'],
        default: 'operational'
    },

    description: {
        type: String,
        trim: true,
        maxLength: [1000, 'Description cannot exceed 1000 characters']
    },

    // Report Configuration
    dateRange: {
        from: {
            type: Date,
            required: true
        },
        to: {
            type: Date,
            required: true
        }
    },

    // Generation Settings
    format: {
        type: String,
        enum: ['pdf', 'excel', 'csv', 'json'],
        default: 'pdf'
    },

    template: {
        type: String,
        enum: ['standard', 'executive', 'detailed', 'summary'],
        default: 'standard'
    },

    // Filters and Parameters
    filters: {
        locations: [String],
        equipmentTypes: [String],
        equipmentIds: [mongoose.Schema.Types.ObjectId],
        sensorTypes: [String],
        sensorIds: [mongoose.Schema.Types.ObjectId],
        severityLevels: [String],
        priorities: [String],
        assignedTo: [mongoose.Schema.Types.ObjectId]
    },

    // KPI Configuration (for KPI reports)
    kpiMetrics: {
        availability: {
            include: {
                type: Boolean,
                default: true
            },
            target: {
                type: Number,
                default: 95 // percentage
            }
        },
        reliability: {
            include: {
                type: Boolean,
                default: true
            },
            target: {
                type: Number,
                default: 98 // percentage
            }
        },
        efficiency: {
            include: {
                type: Boolean,
                default: true
            },
            target: {
                type: Number,
                default: 90 // percentage
            }
        },
        mttr: { // Mean Time To Repair
            include: {
                type: Boolean,
                default: true
            },
            target: {
                type: Number,
                default: 4 // hours
            }
        },
        mtbf: { // Mean Time Between Failures
            include: {
                type: Boolean,
                default: true
            },
            target: {
                type: Number,
                default: 720 // hours
            }
        },
        safetyIncidents: {
            include: {
                type: Boolean,
                default: true
            },
            target: {
                type: Number,
                default: 0 // incidents
            }
        },
        environmentalCompliance: {
            include: {
                type: Boolean,
                default: true
            },
            target: {
                type: Number,
                default: 100 // percentage
            }
        }
    },

    // Generation Status
    status: {
        type: String,
        enum: ['pending', 'generating', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },

    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // File Information
    filePath: String,
    fileName: String,
    fileSize: Number,
    fileUrl: String,

    // Generation Details
    generationStartedAt: Date,
    generationCompletedAt: Date,
    generationDuration: Number, // seconds

    errorMessage: String,
    errorDetails: mongoose.Schema.Types.Mixed,

    // Report Data Summary
    dataSummary: {
        recordsProcessed: Number,
        equipmentCount: Number,
        sensorCount: Number,
        incidentCount: Number,
        maintenanceRecordCount: Number,
        dataQuality: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor'],
            default: 'good'
        }
    },

    // Report Content (for JSON reports or caching)
    reportData: mongoose.Schema.Types.Mixed,

    // Distribution
    distribution: {
        email: {
            enabled: {
                type: Boolean,
                default: false
            },
            recipients: [{
                email: String,
                name: String,
                role: String
            }],
            subject: String,
            body: String,
            sentAt: Date
        },

        notifications: {
            enabled: {
                type: Boolean,
                default: true
            },
            notifyOnCompletion: {
                type: Boolean,
                default: true
            },
            notifyOnFailure: {
                type: Boolean,
                default: true
            }
        }
    },

    // Scheduling (for recurring reports)
    schedule: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
            default: 'monthly'
        },
        nextRunDate: Date,
        lastRunDate: Date,
        cronExpression: String
    },

    // Access Control
    visibility: {
        type: String,
        enum: ['private', 'team', 'department', 'public'],
        default: 'private'
    },

    accessPermissions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        },
        permissions: {
            view: {
                type: Boolean,
                default: true
            },
            download: {
                type: Boolean,
                default: true
            },
            share: {
                type: Boolean,
                default: false
            }
        }
    }],

    // Downloads and Views
    downloadCount: {
        type: Number,
        default: 0
    },

    viewCount: {
        type: Number,
        default: 0
    },

    lastAccessedAt: Date,

    // Tags and Categories
    tags: [String],

    // Comments and Notes
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxLength: [500, 'Comment cannot exceed 500 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    notes: String,

    // Version Control
    version: {
        type: String,
        default: "1.0"
    },

    previousVersions: [{
        version: String,
        filePath: String,
        generatedAt: Date,
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

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

    // Soft Delete
    deletedAt: {
        type: Date,
        default: null
    },

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save hook to generate sequential reportCode
reportSchema.pre('save', async function () {
    if (this.isNew && !this.reportCode) {
        // Determine prefix based on report type
        let prefix = '';
        switch (this.type) {
            case 'kpi':
                prefix = 'KPI';
                break;
            case 'maintenance':
                prefix = 'MNT';
                break;
            case 'incident':
                prefix = 'INC';
                break;
            case 'sensor':
                prefix = 'SNS';
                break;
            case 'equipment':
                prefix = 'EQP';
                break;
            default:
                prefix = 'RPT';
        }

        const counter = await Counter.getNextSequenceValue(`report_${this.type}`);
        this.reportCode = `${prefix}_${counter.toString().padStart(5, '0')}`;
    }

    // Validate date range
    if (this.dateRange.from >= this.dateRange.to) {
        throw new Error('Start date must be before end date');
    }

    // Update generation duration if completed
    if (this.status === 'completed' && this.generationStartedAt && this.generationCompletedAt) {
        this.generationDuration = Math.ceil((this.generationCompletedAt - this.generationStartedAt) / 1000);
    }
});

// Indexes for efficient querying
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ createdBy: 1, createdAt: -1 });
reportSchema.index({ 'dateRange.from': 1, 'dateRange.to': 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ deletedAt: 1 });
reportSchema.index({ 'schedule.enabled': 1, 'schedule.nextRunDate': 1 });

// Instance method for soft delete
reportSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    return this.save();
};

// Static method to find active reports
reportSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, deletedAt: null });
};

// Instance method to update status
reportSchema.methods.updateStatus = function (status, progress = null, errorMessage = null) {
    this.status = status;

    if (progress !== null) {
        this.progress = Math.max(0, Math.min(100, progress));
    }

    if (errorMessage) {
        this.errorMessage = errorMessage;
    }

    if (status === 'generating' && !this.generationStartedAt) {
        this.generationStartedAt = new Date();
    }

    if (status === 'completed' && !this.generationCompletedAt) {
        this.generationCompletedAt = new Date();
        this.progress = 100;
    }

    return this.save();
};

// Instance method to increment download count
reportSchema.methods.incrementDownload = function () {
    this.downloadCount += 1;
    this.lastAccessedAt = new Date();
    return this.save({ validateBeforeSave: false });
};

// Instance method to increment view count
reportSchema.methods.incrementView = function () {
    this.viewCount += 1;
    this.lastAccessedAt = new Date();
    return this.save({ validateBeforeSave: false });
};

// Static method to find reports by user access
reportSchema.statics.findByUserAccess = function (userId, filter = {}) {
    return this.find({
        ...filter,
        deletedAt: null,
        $or: [
            { createdBy: userId },
            { visibility: 'public' },
            { 'accessPermissions.user': userId }
        ]
    }).populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
};

// Virtual for file size in MB
reportSchema.virtual('fileSizeMB').get(function () {
    if (!this.fileSize) return 0;
    return Math.round((this.fileSize / (1024 * 1024)) * 100) / 100;
});

// Virtual for generation duration formatted
reportSchema.virtual('generationDurationFormatted').get(function () {
    if (!this.generationDuration) return null;

    const minutes = Math.floor(this.generationDuration / 60);
    const seconds = this.generationDuration % 60;

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
});

// Virtual for report age
reportSchema.virtual('reportAge').get(function () {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
});

export default mongoose.model("Report", reportSchema);
