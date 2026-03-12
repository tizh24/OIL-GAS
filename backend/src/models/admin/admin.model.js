import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'super_admin'],
            message: 'Role must be either admin or super_admin'
        },
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
adminSchema.index({ email: 1 });
adminSchema.index({ username: 1 });
adminSchema.index({ deletedAt: 1 });

// Virtual for admin status
adminSchema.virtual('status').get(function () {
    if (this.deletedAt) return 'deleted';
    return this.isActive ? 'active' : 'inactive';
});

// Soft delete method
adminSchema.methods.softDelete = function (deletedBy) {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.isActive = false;
    return this.save();
};

// Update last login
adminSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
};

// Pre-find middleware to exclude deleted admins by default
adminSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeDeleted) {
        this.find({ deletedAt: null });
    }
    next();
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
