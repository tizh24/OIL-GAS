import mongoose from "mongoose";

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not set");
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2) {
        return mongoose.connection;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        return mongoose.connection;
    } catch (error) {
        console.error("MongoDB error:", error.message);
        throw error;
    }
};

export default connectDB;
