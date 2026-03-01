import mongoose from "mongoose";

const instrumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ["pressure", "temperature", "flow", "level", "analytical", "safety", "control", "monitoring", "other"],
        index: true
    },
    serial: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ["operational", "calibration", "maintenance", "faulty", "out-of-service"],
        default: "operational",
        index: true
    },
    location: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    specifications: {
        range: String,
        accuracy: String,
        resolution: String,
        operatingTemp: String,
        operatingPressure: String,
        powerSupply: String,
        output: String,
        communication: String,
        mounting: String,
        certification: [String],
        technicalSpecs: [{
            parameter: String,
            value: String,
            unit: String
        }]
    },
    operationalParameters: {
        currentReading: {
            value: Number,
            unit: String,
            timestamp: Date
        },
        setPoint: {
            value: Number,
            unit: String
        },
        alarmLimits: {
            high: Number,
            low: Number,
            unit: String
        },
        calibrationDate: Date,
        nextCalibrationDate: Date
    },
    model3D: {
        fileName: String,
        filePath: String,
        fileSize: Number,
        uploadedAt: Date,
        version: String
    },
    assignedEngineers: [{
        engineer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role: {
            type: String,
            enum: ["primary", "secondary", "backup"],
            default: "primary"
        },
        assignedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastMaintenance: {
        date: Date,
        type: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        notes: String,
        nextDue: Date
    },
    installationDate: {
        type: Date
    },
    warrantyExpiry: {
        type: Date
    },
    documentation: [{
        type: String, // manual, datasheet, certificate, etc.
        fileName: String,
        filePath: String,
        uploadedAt: Date,
        version: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
instrumentSchema.index({ status: 1, type: 1 });
instrumentSchema.index({ location: 1, status: 1 });
instrumentSchema.index({ name: "text", manufacturer: "text", model: "text" });
instrumentSchema.index({ deletedAt: 1 });
instrumentSchema.index({ "assignedEngineers.engineer": 1 });

// Instance method for soft delete
instrumentSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    this.status = 'out-of-service';
    return this.save();
};

// Static method to find active instruments
instrumentSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, deletedAt: null });
};

// Static method to find with filters and pagination
instrumentSchema.statics.findWithFilters = function (filters, options = {}) {
    const query = { deletedAt: null };

    if (filters.name) {
        query.$text = { $search: filters.name };
    }
    if (filters.type) {
        query.type = filters.type;
    }
    if (filters.status) {
        query.status = filters.status;
    }
    if (filters.location) {
        query.location = new RegExp(filters.location, 'i');
    }

    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return this.find(query)
        .populate('assignedEngineers.engineer', 'name email department')
        .populate('createdBy updatedBy', 'name email')
        .populate('lastMaintenance.performedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

// Static method to find by engineer
instrumentSchema.statics.findByEngineer = function (engineerId) {
    return this.find({
        "assignedEngineers.engineer": engineerId,
        deletedAt: null
    }).populate('assignedEngineers.engineer', 'name email department');
};

// Virtual for calibration status
instrumentSchema.virtual('calibrationStatus').get(function () {
    if (!this.operationalParameters.nextCalibrationDate) return 'unknown';

    const now = new Date();
    const daysUntilCalibration = Math.ceil((this.operationalParameters.nextCalibrationDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilCalibration < 0) return 'overdue';
    if (daysUntilCalibration <= 30) return 'due-soon';
    return 'current';
});

// Virtual for maintenance status
instrumentSchema.virtual('maintenanceStatus').get(function () {
    if (!this.lastMaintenance.nextDue) return 'unknown';

    const now = new Date();
    const daysUntilMaintenance = Math.ceil((this.lastMaintenance.nextDue - now) / (1000 * 60 * 60 * 24));

    if (daysUntilMaintenance < 0) return 'overdue';
    if (daysUntilMaintenance <= 7) return 'due-soon';
    return 'scheduled';
});

export default mongoose.model("Instrument", instrumentSchema);