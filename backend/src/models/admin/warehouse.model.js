import mongoose from "mongoose";

/**
 * Warehouse – storage/location resource initialised by Admin.
 * Acts as the canonical location reference used by Equipment and Instrument. (SRS §96)
 */
const warehouseSchema = new mongoose.Schema(
    {
        code: {
            // Unique warehouse code, e.g. "WH-001"
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            maxlength: 32
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 128
        },
        description: {
            type: String,
            trim: true,
            maxlength: 512,
            default: ""
        },
        location: {
            address: { type: String, trim: true },
            city: { type: String, trim: true },
            country: { type: String, trim: true, default: "Vietnam" },
            coordinates: {
                lat: { type: Number },
                lng: { type: Number }
            }
        },
        type: {
            type: String,
            required: true,
            enum: ["main", "field", "temporary", "offshore", "other"],
            default: "main"
        },
        capacity: {
            total: { type: Number, default: 0, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            unit: { type: String, default: "units" }
        },
        // currentLoad: tổng lượng dầu/hàng tồn kho hiện tại (SRS §96)
        currentLoad: { type: Number, default: 0, min: 0 },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        status: {
            type: String,
            enum: ["active", "inactive", "under-maintenance"],
            default: "active"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true }
);

// Indexes
warehouseSchema.index({ status: 1, type: 1 });
warehouseSchema.index({ deletedAt: 1 });
warehouseSchema.index({ name: "text", description: "text" });

warehouseSchema.methods.softDelete = function (deletedByUserId, reason) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    this.status = "inactive";
    return this.save();
};

export default mongoose.model("Warehouse", warehouseSchema);
