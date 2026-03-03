import mongoose from "mongoose";
import Counter from "./counter.model.js";

const refreshTokenSchema = new mongoose.Schema({    tokenCode: {
        type: String,
        unique: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    token: String,
    expiresAt: Date
}, {
    timestamps: true
});

// Pre-save hook to generate sequential tokenCode with prefix
refreshTokenSchema.pre('save', async function () {
    if (this.isNew && !this.tokenCode) {
        // Generate refresh token code with prefix
        const counter = await Counter.getNextSequenceValue('refresh_token');
        this.tokenCode = `TKN_${counter.toString().padStart(5, '0')}`;
    }
});

// TTL index to automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", refreshTokenSchema);
