import app from "../src/app.js";
import connectDB from "../src/config/db.js";
import "dotenv/config";

let isConnected = false;

export default async function handler(req, res) {
    try {
        // Check for required environment variables
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI environment variable is not set");
            return res.status(500).json({
                success: false,
                message: "Database configuration error",
                error: process.env.NODE_ENV !== 'production' ? "MONGODB_URI not set" : undefined
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET environment variable is not set");
            return res.status(500).json({
                success: false,
                message: "Authentication configuration error",
                error: process.env.NODE_ENV !== 'production' ? "JWT_SECRET not set" : undefined
            });
        }

        // Only connect once to avoid multiple connections
        if (!isConnected) {
            console.log("Attempting to connect to MongoDB...");
            await connectDB();
            isConnected = true;
            console.log("MongoDB connection established");
        }

        // Set CORS headers for all requests
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Handle the request with Express app
        return app(req, res);
    } catch (error) {
        console.error("Handler error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
}
