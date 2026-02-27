import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
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
    timestamps: true // This adds createdAt and updatedAt automatically
});

// Add soft delete middleware
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({ deletedAt: { $eq: null } });
    next();
});

// Instance method for soft delete
userSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    this.status = 'inactive';
    return this.save();
};

// Static method to find deleted users
userSchema.statics.findDeleted = function () {
    return this.find({ deletedAt: { $ne: null } });
};

// Static method to find with deleted users
userSchema.statics.findWithDeleted = function () {
    return this.find({});
};

export default mongoose.model("User", userSchema);
