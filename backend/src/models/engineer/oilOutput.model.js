import mongoose from "mongoose";

const oilOutputSchema = new mongoose.Schema({
    wellId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Well',
        required: true,
        index: true
    },
    recordedAt: {
        type: Date,
        default: Date.now,
        index: -1
    },
    productionVolume: {
        value: Number,
        unit: String
    },
    flowRate: {
        value: Number,
        unit: String
    },
    pressure: {
        value: Number,
        unit: String
    },
    temperature: {
        value: Number,
        unit: String
    },
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: false
});

oilOutputSchema.index({ wellId: 1, recordedAt: -1 });
oilOutputSchema.index({ recordedAt: -1 });

export default mongoose.model('OilOutput', oilOutputSchema);
