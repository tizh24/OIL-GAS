import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth Service is running',
        service: 'auth-service',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const startServer = async () => {
    try {
        await connectDB("Oil_Gas_Auth");
        app.listen(PORT, () => {
            console.log(`Auth Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start Auth Service:", error.message);
        process.exit(1);
    }
};

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export default app;
