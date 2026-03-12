import express from "express";
import cors from "cors";
import rateLimit from 'express-rate-limit';
import userRoutes from "./routes/user.route.js";
import { swaggerDocs } from "./config/swagger.js";
import authRoutes from "./routes/auth.route.js";
import equipmentRoutes from "./routes/engineer/equipment.routes.js";
import instrumentRoutes from "./routes/engineer/instrument.routes.js";
import threeDRoutes from "./routes/engineer/3d.routes.js";
import incidentRoutes from "./routes/engineer/incident.route.js";
import sensorRoutes from "./routes/engineer/sensor.routes.js";
import reportRoutes from "./routes/engineer/report.routes.js";
import adminRoutes from "./routes/admin/index.js";
import { notFound, errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// Basic rate limiter for all requests
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // limit each IP to 120 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
});

app.use(apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/engineer/equipment", equipmentRoutes);
app.use("/api/engineer/instruments", instrumentRoutes);
app.use("/api/engineer/sensors", sensorRoutes);
app.use("/api/engineer/reports", reportRoutes);
app.use("/api/engineer", incidentRoutes);
app.use("/api/3d", threeDRoutes);
app.use("/api/control", threeDRoutes);
app.use("/api/admin", adminRoutes);

// Setup Swagger documentation BEFORE 404 handlers
swaggerDocs(app);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
