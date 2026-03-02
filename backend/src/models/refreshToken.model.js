import mongoose from "mongoose";
import Counter from "./counter.model.js";

const refreshTokenSchema = new mongoose.Schema({
    _id: {
        type: Number,
        unique: true
    },
    user: { type: Number, ref: "User" },
    token: String,
    expiresAt: Date
}, {
    _id: false
});

// Pre-save hook to generate sequential ID
refreshTokenSchema.pre('save', async function (next) {
    if (this.isNew) {
        this._id = await Counter.getNextSequenceValue('refreshToken');
    }
    next();
});

// TTL index to automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", refreshTokenSchema);
