import mongoose from "mongoose";
import Counter from "./counter.model.js";

const userSchema = new mongoose.Schema({
    userCode: {
        type: Number,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    }, password: {
        type: String,
        required: true,
        select: false
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
    }, status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
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

// Pre-save hook to generate sequential userCode
userSchema.pre('save', async function () {
    if (this.isNew) {
        this.userCode = await Counter.getNextSequenceValue('user');
    }
});

userSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    this.status = 'inactive';
    return this.save();
};

userSchema.statics.findDeleted = function () {
    return this.find({ deletedAt: { $ne: null } });
};

userSchema.statics.findWithDeleted = function () {
    return this.find({});
};

export default mongoose.model("User", userSchema);
