import express from "express";
import equipmentRoutes from "./equipment.route.js";
import instrumentRoutes from "./instrument.route.js";
import incidentRoutes from "./incident.route.js";
import incidentLogRoutes from "./incidentLog.route.js";
import maintenanceRoutes from "./maintenance.route.js";
import maintenanceHistoryRoutes from "./maintenanceHistory.route.js";
import warehouseRoutes from "./warehouse.route.js";
import dashboardRoutes from "./dashboard.route.js";
import auditLogRoutes from "./auditLog.route.js";
import monitoringRoutes from "./monitoring.route.js";

const router = express.Router();

// Use routes
router.use("/equipment", equipmentRoutes);
router.use("/instruments", instrumentRoutes);
router.use("/incidents", incidentRoutes);
router.use("/incident-logs", incidentLogRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/maintenance-history", maintenanceHistoryRoutes);
router.use("/warehouses", warehouseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/monitoring", monitoringRoutes);

export default router;
