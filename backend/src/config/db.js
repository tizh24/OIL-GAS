import mongoose from "mongoose";

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI is not set in environment");
        throw new Error("MONGODB_URI is not set");
    }

    if (mongoose.connection.readyState === 1) {
        console.log("MongoDB already connected");
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2) {
        console.log("MongoDB connection in progress");
        return mongoose.connection;
    }

    try {
        console.log("Connecting to MongoDB...");
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return mongoose.connection;
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
};

export default connectDB;
