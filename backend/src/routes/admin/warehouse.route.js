import express from "express";
import {
    getAllWarehouses,
    getInventoryReport,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    receiveOil,
    dispatch,
    getWarehouseLogs
} from "../../controllers/admin/warehouse.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import {
    createWarehouseValidationSchema,
    updateWarehouseValidationSchema,
    warehouseInventoryValidationSchema
} from "../../utils/validation.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Warehouse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         location:
 *           type: string
 *         capacity:
 *           type: number
 *         currentLoad:
 *           type: number
 *         description:
 *           type: string
 */

// Apply authentication and role-based access to all routes
router.use(protect);
router.use(allowRoles(["admin", "super_admin"]));

// Warehouse CRUD routes
router.get("/", getAllWarehouses);
router.get("/report", getInventoryReport);
router.get("/:id", getWarehouseById);
router.post("/", validateRequest(createWarehouseValidationSchema), createWarehouse);
router.put("/:id", validateRequest(updateWarehouseValidationSchema), updateWarehouse);
router.delete("/:id", deleteWarehouse);

// Inventory management routes
router.post("/receive", validateRequest(warehouseInventoryValidationSchema), receiveOil);
router.post("/dispatch", validateRequest(warehouseInventoryValidationSchema), dispatch);
router.get("/:id/logs", getWarehouseLogs);

export default router;
