import mongoose from "mongoose";
import Counter from "./counter.model.js";

const userSchema = new mongoose.Schema({
    userCode: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false
    },
    department: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ["admin", "engineer", "supervisor"],
        default: "engineer"
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    lastLoginAt: {
        type: Date,
        default: null
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

// Pre-save hook to generate sequential userCode with prefix
userSchema.pre('save', async function () {
    if (this.isNew && !this.userCode) {
        // Determine prefix based on role
        let prefix = '';
        switch (this.role) {
            case 'engineer':
                prefix = 'ENG';
                break;
            case 'supervisor':
                prefix = 'SUP';
                break;
            case 'admin':
                prefix = 'ADM';
                break;
            default:
                prefix = 'USR';
        }

        // Get counter for this role
        const counter = await Counter.getNextSequenceValue(`user_${this.role}`);
        this.userCode = `${prefix}_${counter.toString().padStart(5, '0')}`;
    }
});

userSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    this.status = 'inactive';
    return this.save();
};

userSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, deletedAt: null });
};

userSchema.statics.findDeleted = function () {
    return this.find({ deletedAt: { $ne: null } });
};

userSchema.statics.findWithDeleted = function () {
    return this.find({});
};

export default mongoose.model("User", userSchema);
