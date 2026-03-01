import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ["drilling", "pumping", "safety", "measurement", "transportation", "other"],
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
        enum: ["operational", "maintenance", "out-of-service", "repair", "inspection"],
        default: "operational",
        index: true
    },
    location: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    technicalSpecs: {
        capacity: String,
        powerRating: String,
        operatingPressure: String,
        operatingTemperature: String,
        weight: String,
        dimensions: String,
        specifications: [{
            parameter: String,
            value: String,
            unit: String
        }]
    },
    purchaseDate: {
        type: Date
    },
    warrantyExpiry: {
        type: Date
    },
    lastMaintenance: {
        date: Date,
        type: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        notes: String
    },
    nextScheduledMaintenance: {
        type: Date
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
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
equipmentSchema.index({ status: 1, location: 1 });
equipmentSchema.index({ name: "text", manufacturer: "text", model: "text" });
equipmentSchema.index({ deletedAt: 1 });

// Instance method for soft delete
equipmentSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    this.status = 'out-of-service';
    return this.save();
};

// Static method to find active equipment
equipmentSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, deletedAt: null });
};

// Static method to find with filters and pagination
equipmentSchema.statics.findWithFilters = function (filters, options = {}) {
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
        .populate('assignedTo createdBy', 'name email')
        .populate('lastMaintenance.performedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

// Virtual for maintenance status
equipmentSchema.virtual('maintenanceStatus').get(function () {
    if (!this.nextScheduledMaintenance) return 'unknown';

    const now = new Date();
    const daysUntilMaintenance = Math.ceil((this.nextScheduledMaintenance - now) / (1000 * 60 * 60 * 24));

    if (daysUntilMaintenance < 0) return 'overdue';
    if (daysUntilMaintenance <= 7) return 'due-soon';
    return 'scheduled';
});

export default mongoose.model("Equipment", equipmentSchema);
