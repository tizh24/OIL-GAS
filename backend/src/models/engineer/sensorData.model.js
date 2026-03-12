import mongoose from "mongoose";

const sensorDataSchema = new mongoose.Schema({
    sensorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor',
        required: true,
        index: true
    },
    equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        index: true
    },
    value: {
        type: Number,
        required: true
    },
    unit: String,
    quality: {
        type: String,
        enum: ['good', 'bad', 'uncertain', 'substituted'],
        default: 'good'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: -1
    },
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: false
});

// Compound index for typical time-series queries
sensorDataSchema.index({ sensorId: 1, timestamp: -1 });
sensorDataSchema.index({ equipmentId: 1, timestamp: -1 });

export default mongoose.model('SensorData', sensorDataSchema);
