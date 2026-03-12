import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.route.js";
import { swaggerDocs } from "./config/swagger.js";
import authRoutes from "./routes/auth.route.js";
import equipmentRoutes from "./routes/engineer/equipment.routes.js";
import instrumentRoutes from "./routes/engineer/instrument.routes.js";
import threeDRoutes from "./routes/engineer/3d.routes.js";
import incidentRoutes from "./routes/engineer/incident.route.js";
import sensorRoutes from "./routes/engineer/sensor.routes.js";
import reportRoutes from "./routes/engineer/report.routes.js";

const app = express();

app.use(cors());
app.use(express.json());



app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/engineer/equipment", equipmentRoutes);
app.use("/api/engineer/instruments", instrumentRoutes);
app.use("/api/engineer/sensors", sensorRoutes);
app.use("/api/engineer/reports", reportRoutes);
app.use("/api/engineer", incidentRoutes);
app.use("/api/3d", threeDRoutes);
app.use("/api/control", threeDRoutes);

// Setup Swagger documentation BEFORE 404 handlers
swaggerDocs(app);

export default app;
