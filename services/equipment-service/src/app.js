import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import equipmentRoutes from "./routes/equipment.route.js";

const app = express();
const PORT = process.env.EQUIPMENT_SERVICE_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Equipment Service is running',
        service: 'equipment-service',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use("/api/equipment", equipmentRoutes);
app.use("/api/instruments", equipmentRoutes); // For now, instruments use same routes

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
        await connectDB("Oil_Gas_Equipment");
        app.listen(PORT, () => {
            console.log(`Equipment Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start Equipment Service:", error.message);
        process.exit(1);
    }
};

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export default app;
