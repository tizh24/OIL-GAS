import mongoose from "mongoose";
import Counter from "../counter.model.js";

const maintenanceRecordSchema = new mongoose.Schema({    recordCode: {
        type: String,
        unique: true
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ["preventive", "corrective", "predictive", "emergency", "inspection", "calibration"],
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ["scheduled", "in-progress", "completed", "cancelled", "delayed"],
        default: "scheduled"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium"
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    startDate: {
        type: Date
    },
    completedDate: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        min: 0
    },
    actualHours: {
        type: Number,
        min: 0
    }, engineerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    description: {
        type: String,
        required: true
    },
    workPerformed: {
        type: String
    },
    partsUsed: [{
        partName: String,
        partNumber: String,
        quantity: Number,
        cost: Number
    }],
    findings: {
        condition: {
            type: String,
            enum: ["excellent", "good", "fair", "poor", "critical"],
            default: "good"
        },
        issues: [String],
        recommendations: [String],
        followUpRequired: {
            type: Boolean,
            default: false
        }
    },
    cost: {
        labor: {
            type: Number,
            default: 0
        },
        parts: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: {
        type: String
    },
    nextMaintenanceDate: {
        type: Date
    }, createdBy: {
        type: Number,
        ref: "User",
        required: true
    },
    updatedBy: {
        type: Number,
        ref: "User"
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: Number,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true,
    _id: false
});

// Pre-save hook to generate sequential recordCode with prefix
maintenanceRecordSchema.pre('save', async function () {
    if (this.isNew && !this.recordCode) {
        // Determine prefix based on maintenance type
        let prefix = '';
        switch (this.type) {
            case 'preventive':
                prefix = 'PRV';
                break;
            case 'corrective':
                prefix = 'COR';
                break;
            case 'predictive':
                prefix = 'PRD';
                break;
            case 'emergency':
                prefix = 'EMG';
                break;
            case 'inspection':
                prefix = 'INS';
                break;
            case 'calibration':
                prefix = 'CAL';
                break;
            default:
                prefix = 'MNT';
        }
        
        // Get counter for this maintenance type
        const counter = await Counter.getNextSequenceValue(`maintenance_${this.type}`);
        this.recordCode = `${prefix}_${counter.toString().padStart(5, '0')}`;
    }
});

// Indexes for efficient querying
maintenanceRecordSchema.index({ equipment: 1, scheduledDate: -1 });
maintenanceRecordSchema.index({ engineerId: 1, status: 1 });
maintenanceRecordSchema.index({ type: 1, priority: 1 });
maintenanceRecordSchema.index({ deletedAt: 1 });

// Pre-save middleware to calculate total cost
maintenanceRecordSchema.pre('save', function (next) {
    this.cost.total = this.cost.labor + this.cost.parts;
    next();
});

// Instance method for soft delete
maintenanceRecordSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    this.status = 'cancelled';
    return this.save();
};

// Static method to find by equipment
maintenanceRecordSchema.statics.findByEquipment = function (equipmentId, options = {}) {
    const query = { equipment: equipmentId, deletedAt: null };

    // Date range filter
    if (options.startDate || options.endDate) {
        query.scheduledDate = {};
        if (options.startDate) {
            query.scheduledDate.$gte = new Date(options.startDate);
        }
        if (options.endDate) {
            query.scheduledDate.$lte = new Date(options.endDate);
        }
    }

    return this.find(query)
        .populate('engineerId supervisorId', 'name email department')
        .populate('equipment', 'name type serial model')
        .sort({ scheduledDate: -1 });
};

// Static method to find active records
maintenanceRecordSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, deletedAt: null });
};

// Virtual for duration in hours
maintenanceRecordSchema.virtual('durationHours').get(function () {
    if (this.startDate && this.completedDate) {
        return Math.ceil((this.completedDate - this.startDate) / (1000 * 60 * 60));
    }
    return null;
});

// Virtual for status indicator
maintenanceRecordSchema.virtual('statusIndicator').get(function () {
    const now = new Date();

    if (this.status === 'completed') return 'completed';
    if (this.status === 'cancelled') return 'cancelled';
    if (this.scheduledDate < now && this.status !== 'completed') return 'overdue';
    if (this.status === 'in-progress') return 'in-progress';
    return 'scheduled';
});

export default mongoose.model("MaintenanceRecord", maintenanceRecordSchema);
