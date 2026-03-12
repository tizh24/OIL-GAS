import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    alertCode: { type: String, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'error', 'critical'], index: true },
    source: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
    acknowledged: { type: Boolean, default: false, index: true },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date,
    createdAt: { type: Date, default: Date.now, index: -1 },
    deletedAt: { type: Date, default: null }
});

alertSchema.index({ severity: 1, acknowledged: 1, createdAt: -1 });
alertSchema.index({ acknowledged: 1, createdAt: -1 });

export default mongoose.model('Alert', alertSchema);
