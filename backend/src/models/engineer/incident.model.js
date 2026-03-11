import mongoose from "mongoose";
import Counter from "../counter.model.js";

// Incident Schema
const incidentSchema = new mongoose.Schema({
    incidentCode: {
        type: String,
        unique: true
    },

    title: {
        type: String,
        required: [true, 'Incident title is required'],
        trim: true,
        maxLength: [200, 'Title cannot exceed 200 characters']
    },

    description: {
        type: String,
        required: [true, 'Incident description is required'],
        trim: true,
        maxLength: [2000, 'Description cannot exceed 2000 characters']
    },

    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: [true, 'Severity is required'],
        index: true
    },

    status: {
        type: String,
        enum: ['open', 'investigating', 'resolved', 'closed'],
        default: 'open',
        index: true
    },

    type: {
        type: String,
        enum: ['equipment_failure', 'safety_violation', 'environmental', 'operational', 'maintenance', 'other'],
        required: [true, 'Incident type is required']
    },

    location: {
        type: String,
        required: [true, 'Incident location is required'],
        trim: true
    },

    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: false
    },

    instrument: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instrument',
        required: false
    },

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reporter is required']
    },

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },

    reportedAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    acknowledgedAt: {
        type: Date,
        required: false
    },

    resolvedAt: {
        type: Date,
        required: false
    },

    resolution: {
        type: String,
        trim: true,
        maxLength: [1000, 'Resolution cannot exceed 1000 characters']
    },

    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    attachments: [{
        filename: String,
        originalName: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now }
    }],

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

    // Soft delete
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Auto-generate incident code
incidentSchema.pre('save', async function () {
    if (this.isNew && !this.incidentCode) {
        const counter = await Counter.findByIdAndUpdate(
            'incidentId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.incidentCode = `INC_${String(counter.seq).padStart(5, '0')}`;
    }
});

// Indexes for better query performance  
incidentSchema.index({ severity: 1, status: 1, reportedAt: -1 });
incidentSchema.index({ reportedBy: 1, reportedAt: -1 });
incidentSchema.index({ assignedTo: 1, status: 1 });
incidentSchema.index({ equipment: 1, reportedAt: -1 });
incidentSchema.index({ instrument: 1, reportedAt: -1 });
incidentSchema.index({ deletedAt: 1 });

// Static methods for filtering
incidentSchema.statics.findWithFilters = function (filters, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    let query = this.find({ deletedAt: null });

    if (filters.severity) query = query.where('severity', filters.severity);
    if (filters.status) query = query.where('status', filters.status);
    if (filters.instrument) query = query.where('instrument', filters.instrument);
    if (filters.startDate || filters.endDate) {
        const dateFilter = {};
        if (filters.startDate) dateFilter.$gte = new Date(filters.startDate);
        if (filters.endDate) dateFilter.$lte = new Date(filters.endDate);
        query = query.where('reportedAt', dateFilter);
    }

    return query
        .populate('reportedBy', 'name email userCode')
        .populate('assignedTo', 'name email userCode')
        .populate('equipment', 'name type equipmentCode')
        .populate('instrument', 'name type instrumentCode')
        .sort({ reportedAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Alert Schema
const alertSchema = new mongoose.Schema({
    alertCode: {
        type: String,
        unique: true
    },

    title: {
        type: String,
        required: [true, 'Alert title is required'],
        trim: true,
        maxLength: [200, 'Title cannot exceed 200 characters']
    },

    message: {
        type: String,
        required: [true, 'Alert message is required'],
        trim: true,
        maxLength: [1000, 'Message cannot exceed 1000 characters']
    },

    severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'critical'],
        required: [true, 'Severity is required'],
        index: true
    },

    type: {
        type: String,
        enum: ['system', 'equipment', 'maintenance', 'safety', 'environmental'],
        required: [true, 'Alert type is required']
    },

    source: {
        equipment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment'
        },
        instrument: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Instrument'
        }
    },

    acknowledged: {
        type: Boolean,
        default: false,
        index: true
    },

    acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },

    acknowledgedAt: {
        type: Date,
        required: false
    },

    triggerValue: {
        type: Number,
        required: false
    },

    thresholdValue: {
        type: Number,
        required: false
    },

    unit: {
        type: String,
        required: false
    },

    // Soft delete
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Auto-generate alert code
alertSchema.pre('save', async function () {
    if (this.isNew && !this.alertCode) {
        const counter = await Counter.findByIdAndUpdate(
            'alertId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.alertCode = `ALT_${String(counter.seq).padStart(5, '0')}`;
    }
});

// Indexes for better query performance
alertSchema.index({ severity: 1, acknowledged: 1, createdAt: -1 });
alertSchema.index({ acknowledged: 1, createdAt: -1 });
alertSchema.index({ 'source.equipment': 1, createdAt: -1 });
alertSchema.index({ 'source.instrument': 1, createdAt: -1 });
alertSchema.index({ deletedAt: 1 });

// Static methods for filtering
alertSchema.statics.findWithFilters = function (filters, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    let query = this.find({ deletedAt: null });

    if (filters.severity) query = query.where('severity', filters.severity);
    if (typeof filters.acknowledged === 'boolean') query = query.where('acknowledged', filters.acknowledged);
    if (filters.startDate || filters.endDate) {
        const dateFilter = {};
        if (filters.startDate) dateFilter.$gte = new Date(filters.startDate);
        if (filters.endDate) dateFilter.$lte = new Date(filters.endDate);
        query = query.where('createdAt', dateFilter);
    }

    return query
        .populate('source.equipment', 'name type equipmentCode')
        .populate('source.instrument', 'name type instrumentCode')
        .populate('acknowledgedBy', 'name email userCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

const Incident = mongoose.model("Incident", incidentSchema);
const Alert = mongoose.model("Alert", alertSchema);

export default Incident;
export { Alert };