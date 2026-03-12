import mongoose from "mongoose";
import Counter from "../counter.model.js";

const sensorSchema = new mongoose.Schema({
    sensorCode: {
        type: String,
        unique: true
    },

    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    type: {
        type: String,
        required: true,
        enum: ["pressure", "temperature", "flow", "level", "vibration", "gas", "ph", "conductivity", "other"],
        index: true
    },

    equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
        required: true,
        index: true
    },

    location: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    // Current Reading
    currentReading: {
        value: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        quality: {
            type: String,
            enum: ["good", "bad", "uncertain", "substituted"],
            default: "good"
        }
    },

    // Sensor Configuration
    configuration: {
        range: {
            min: Number,
            max: Number,
            unit: String
        },
        accuracy: {
            type: String,
            default: "±1%"
        },
        resolution: String,
        responseTime: String,
        operatingConditions: {
            temperature: {
                min: Number,
                max: Number,
                unit: String
            },
            pressure: {
                min: Number,
                max: Number,
                unit: String
            },
            humidity: {
                min: Number,
                max: Number,
                unit: String
            }
        }
    },

    // Threshold Settings
    thresholds: {
        high: {
            warning: Number,
            alarm: Number,
            critical: Number
        },
        low: {
            warning: Number,
            alarm: Number,
            critical: Number
        },
        enabled: {
            type: Boolean,
            default: true
        }
    },

    // Calibration
    calibration: {
        lastCalibrationDate: Date,
        nextCalibrationDate: Date,
        calibrationInterval: {
            type: Number,
            default: 365 // days
        },
        calibrationBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        status: {
            type: String,
            enum: ["current", "due-soon", "overdue"],
            default: "current"
        }
    },

    // Communication
    communication: {
        protocol: {
            type: String,
            enum: ["modbus", "hart", "profibus", "foundation-fieldbus", "ethernet", "wireless", "analog"],
            default: "modbus"
        },
        address: String,
        port: Number,
        baudRate: Number,
        dataFormat: String,
        updateRate: {
            type: Number,
            default: 1000 // milliseconds
        }
    },

    // Status
    status: {
        type: String,
        enum: ["online", "offline", "maintenance", "error", "calibrating"],
        default: "online",
        index: true
    },

    // Manufacturer Information
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },

    model: {
        type: String,
        required: true,
        trim: true
    },

    serialNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    // Installation
    installationDate: {
        type: Date,
        default: Date.now
    },

    installedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    // Maintenance
    lastMaintenance: {
        date: Date,
        type: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        notes: String
    },

    nextMaintenanceDate: Date,

    // Historical Data (for trending)
    historicalReadings: [{
        value: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        quality: String
    }],

    // Alarms & Alerts
    activeAlarms: [{
        alarmId: String,
        type: {
            type: String,
            enum: ["warning", "alarm", "critical"]
        },
        message: String,
        value: Number,
        threshold: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        acknowledged: {
            type: Boolean,
            default: false
        },
        acknowledgedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        acknowledgedAt: Date
    }],

    // Notes and Documentation
    notes: String,

    documentation: {
        manualUrl: String,
        calibrationCertificate: String,
        installationDrawing: String
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

    // Soft Delete
    deletedAt: {
        type: Date,
        default: null
    },

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    // Active flag
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save hook to generate sequential sensorCode with prefix
sensorSchema.pre('save', async function () {
    if (this.isNew && !this.sensorCode) {
        // Determine prefix based on sensor type
        let prefix = '';
        switch (this.type) {
            case 'pressure':
                prefix = 'PS';
                break;
            case 'temperature':
                prefix = 'TS';
                break;
            case 'flow':
                prefix = 'FS';
                break;
            case 'level':
                prefix = 'LS';
                break;
            case 'vibration':
                prefix = 'VS';
                break;
            case 'gas':
                prefix = 'GS';
                break;
            case 'ph':
                prefix = 'PH';
                break;
            case 'conductivity':
                prefix = 'CS';
                break;
            default:
                prefix = 'SS';
        }

        // Get counter for this sensor type
        const counter = await Counter.getNextSequenceValue(`sensor_${this.type}`);
        this.sensorCode = `${prefix}_${counter.toString().padStart(5, '0')}`;
    }

    // Update calibration status
    if (this.calibration.nextCalibrationDate) {
        const now = new Date();
        const nextCal = new Date(this.calibration.nextCalibrationDate);
        const daysUntil = (nextCal - now) / (1000 * 60 * 60 * 24);

        if (daysUntil < 0) {
            this.calibration.status = "overdue";
        } else if (daysUntil <= 30) {
            this.calibration.status = "due-soon";
        } else {
            this.calibration.status = "current";
        }
    }
});

// Indexes for efficient querying
sensorSchema.index({ type: 1, status: 1 });
sensorSchema.index({ equipmentId: 1, status: 1 });
sensorSchema.index({ location: 1, isActive: 1 });
sensorSchema.index({ "currentReading.timestamp": -1 });
sensorSchema.index({ deletedAt: 1 });
sensorSchema.index({ name: "text", manufacturer: "text", model: "text" });

// Instance method for soft delete
sensorSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    this.status = 'offline';
    this.isActive = false;
    return this.save();
};

// Static method to find active sensors
sensorSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, deletedAt: null, isActive: true });
};

// Static method to update sensor reading
sensorSchema.statics.updateReading = async function (sensorId, value, quality = 'good') {
    const sensor = await this.findById(sensorId);
    if (!sensor) throw new Error('Sensor not found');

    // Add to historical data (keep last 1000 readings)
    sensor.historicalReadings.push({
        value,
        timestamp: new Date(),
        quality
    });

    // Keep only last 1000 readings
    if (sensor.historicalReadings.length > 1000) {
        sensor.historicalReadings = sensor.historicalReadings.slice(-1000);
    }

    // Update current reading
    sensor.currentReading = {
        value,
        unit: sensor.currentReading.unit,
        timestamp: new Date(),
        quality
    };

    // Check thresholds and create alarms if needed
    sensor.checkThresholds();

    return sensor.save();
};

// Instance method to check thresholds
sensorSchema.methods.checkThresholds = function () {
    if (!this.thresholds.enabled) return;

    const value = this.currentReading.value;
    const thresholds = this.thresholds;

    // Clear existing alarms for this reading
    this.activeAlarms = this.activeAlarms.filter(alarm =>
        alarm.timestamp < new Date(Date.now() - 60000) // Keep alarms older than 1 minute
    );

    // Check high thresholds
    if (thresholds.high.critical && value >= thresholds.high.critical) {
        this.activeAlarms.push({
            alarmId: `${this.sensorCode}_HIGH_CRITICAL_${Date.now()}`,
            type: 'critical',
            message: `Critical high alarm: ${value} >= ${thresholds.high.critical}`,
            value,
            threshold: thresholds.high.critical
        });
    } else if (thresholds.high.alarm && value >= thresholds.high.alarm) {
        this.activeAlarms.push({
            alarmId: `${this.sensorCode}_HIGH_ALARM_${Date.now()}`,
            type: 'alarm',
            message: `High alarm: ${value} >= ${thresholds.high.alarm}`,
            value,
            threshold: thresholds.high.alarm
        });
    } else if (thresholds.high.warning && value >= thresholds.high.warning) {
        this.activeAlarms.push({
            alarmId: `${this.sensorCode}_HIGH_WARNING_${Date.now()}`,
            type: 'warning',
            message: `High warning: ${value} >= ${thresholds.high.warning}`,
            value,
            threshold: thresholds.high.warning
        });
    }

    // Check low thresholds
    if (thresholds.low.critical && value <= thresholds.low.critical) {
        this.activeAlarms.push({
            alarmId: `${this.sensorCode}_LOW_CRITICAL_${Date.now()}`,
            type: 'critical',
            message: `Critical low alarm: ${value} <= ${thresholds.low.critical}`,
            value,
            threshold: thresholds.low.critical
        });
    } else if (thresholds.low.alarm && value <= thresholds.low.alarm) {
        this.activeAlarms.push({
            alarmId: `${this.sensorCode}_LOW_ALARM_${Date.now()}`,
            type: 'alarm',
            message: `Low alarm: ${value} <= ${thresholds.low.alarm}`,
            value,
            threshold: thresholds.low.alarm
        });
    } else if (thresholds.low.warning && value <= thresholds.low.warning) {
        this.activeAlarms.push({
            alarmId: `${this.sensorCode}_LOW_WARNING_${Date.now()}`,
            type: 'warning',
            message: `Low warning: ${value} <= ${thresholds.low.warning}`,
            value,
            threshold: thresholds.low.warning
        });
    }
};

// Virtual for alarm status
sensorSchema.virtual('alarmStatus').get(function () {
    if (this.activeAlarms.length === 0) return 'normal';

    const hasCritical = this.activeAlarms.some(alarm => alarm.type === 'critical');
    const hasAlarm = this.activeAlarms.some(alarm => alarm.type === 'alarm');
    const hasWarning = this.activeAlarms.some(alarm => alarm.type === 'warning');

    if (hasCritical) return 'critical';
    if (hasAlarm) return 'alarm';
    if (hasWarning) return 'warning';
    return 'normal';
});

// Virtual for next calibration days
sensorSchema.virtual('calibrationDaysRemaining').get(function () {
    if (!this.calibration.nextCalibrationDate) return null;

    const now = new Date();
    const nextCal = new Date(this.calibration.nextCalibrationDate);
    return Math.ceil((nextCal - now) / (1000 * 60 * 60 * 24));
});

export default mongoose.model("Sensor", sensorSchema);
