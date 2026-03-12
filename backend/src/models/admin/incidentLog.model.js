import mongoose from "mongoose";

/**
 * IncidentLog – nhật ký sự cố vận hành (SRS §57, §73).
 */
const incidentLogSchema = new mongoose.Schema(
    {
        title:       { type: String, required: true, maxlength: 256 },
        description: { type: String, required: true, maxlength: 2000 },
        severity: {
            type: String,
            required: true,
            enum: ["low", "medium", "high", "critical"]
        },
        status: {
            type: String,
            enum: ["open", "investigating", "resolved", "closed"],
            default: "open"
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "User",
            required: true
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "User",
            default: null
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Warehouse",
            default: null
        },
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
        resolvedAt:  { type: Date, default: null },
        resolution:  { type: String, maxlength: 1000, default: "" },
        attachments: [{ fileName: String, filePath: String, uploadedAt: Date }]
    },
    { timestamps: true }
);

incidentLogSchema.index({ severity: 1, status: 1 });
incidentLogSchema.index({ reportedBy: 1, createdAt: -1 });
incidentLogSchema.index({ warehouseId: 1 });

export default mongoose.model("IncidentLog", incidentLogSchema);
