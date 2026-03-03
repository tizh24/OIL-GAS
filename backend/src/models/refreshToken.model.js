import mongoose from "mongoose";
import Counter from "./counter.model.js";

const refreshTokenSchema = new mongoose.Schema({
    tokenCode: {
        type: Number,
        unique: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    token: String,
    expiresAt: Date
}, {
    timestamps: true
});

// Pre-save hook to generate sequential tokenCode
refreshTokenSchema.pre('save', async function () {
    if (this.isNew) {
        this.tokenCode = await Counter.getNextSequenceValue('refreshToken');
    }
});

// TTL index to automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", refreshTokenSchema);
