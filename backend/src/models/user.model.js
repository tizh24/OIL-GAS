import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    role: {
        type: String,
        enum: ["admin", "engineer", "supervisor"],
        default: "engineer"
    }
});

export default mongoose.model("User", userSchema);
