import mongoose from "mongoose";

/**
 * MaintenanceHistory – lịch sử bảo trì cho Equipment và Instrument (SRS §54, §63).
 */
const maintenanceHistorySchema = new mongoose.Schema(
    {
        equipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Equipment",
            default: null
        },
        instrumentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Instrument",
            default: null
        },
        type: {
            type: String,
            required: true,
            enum: ["preventive", "corrective", "predictive", "emergency", "inspection", "calibration"]
        },
        description: { type: String, required: true, maxlength: 1000 },
        status: {
            type: String,
            enum: ["scheduled", "in-progress", "completed", "cancelled"],
            default: "scheduled"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },
        scheduledDate:  { type: Date, required: true },
        completedDate:  { type: Date, default: null },
        estimatedHours: { type: Number, default: 0 },
        actualHours:    { type: Number, default: 0 },
        cost: {
            parts: { type: Number, default: 0 },
            labor: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "User",
            default: null
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "User",
            required: true
        },
        notes: { type: String, maxlength: 2000, default: "" }
    },
    { timestamps: true }
);

maintenanceHistorySchema.index({ equipmentId: 1, scheduledDate: -1 });
maintenanceHistorySchema.index({ instrumentId: 1, scheduledDate: -1 });
maintenanceHistorySchema.index({ status: 1 });
maintenanceHistorySchema.index({ performedBy: 1 });

export default mongoose.model("MaintenanceHistory", maintenanceHistorySchema);
