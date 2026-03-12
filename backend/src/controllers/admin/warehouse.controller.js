import Warehouse from "../../models/admin/warehouse.model.js";
import Equipment from "../../models/engineer/equipment.model.js";
import { success, error } from "../../utils/response.js";
import { logAudit } from "../../utils/audit.js";
import mongoose from "mongoose";

// GET /api/admin/warehouses
export const getAllWarehouses = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const query = { deletedAt: null };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } }
            ];
        }
        // status filter maps to utilizationStatus virtual — filter post-query
        const [warehouses, total] = await Promise.all([
            Warehouse.find(query)
                .sort({ name: 1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Warehouse.countDocuments(query)
        ]);

        // Apply utilization-status filter after fetch (virtual field)
        const filtered = status
            ? warehouses.filter(w => w.utilizationStatus === status.toUpperCase())
            : warehouses;

        return success(res, "Warehouses retrieved successfully", {
            warehouses: filtered,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve warehouses", err.message);
    }
};

// GET /api/admin/warehouses/report
export const getInventoryReport = async (req, res) => {
    try {
        const warehouses = await Warehouse.find().sort({ name: 1 });

        const report = warehouses.map(w => {
            const pct = w.capacity === 0 ? 0 : Math.round((w.currentLoad / w.capacity) * 100);
            return {
                id: w._id,
                name: w.name,
                location: w.location,
                capacity: w.capacity,
                currentLoad: w.currentLoad,
                utilizationPercent: pct,
                status: pct >= 90 ? "CRITICAL" : pct >= 70 ? "WARNING" : "OK"
            };
        });

        const summary = {
            totalWarehouses: warehouses.length,
            critical: report.filter(r => r.status === "CRITICAL").length,
            warning: report.filter(r => r.status === "WARNING").length,
            ok: report.filter(r => r.status === "OK").length,
            totalCapacity: warehouses.reduce((s, w) => s + w.capacity, 0),
            totalLoad: warehouses.reduce((s, w) => s + w.currentLoad, 0)
        };

        return success(res, "Inventory report retrieved successfully", { summary, warehouses: report });
    } catch (err) {
        return error(res, 500, "Failed to generate inventory report", err.message);
    }
};

// GET /api/admin/warehouses/:id
export const getWarehouseById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid warehouse ID");

        const warehouse = await Warehouse.findById(id);
        if (!warehouse) return error(res, 404, "Warehouse not found");

        return success(res, "Warehouse retrieved successfully", warehouse);
    } catch (err) {
        return error(res, 500, "Failed to retrieve warehouse", err.message);
    }
};

// POST /api/admin/warehouses
export const createWarehouse = async (req, res) => {
    try {
        const { name, location, capacity, description } = req.body;

        if (!name || !location || capacity === undefined) {
            return error(res, 400, "name, location, capacity are required");
        }

        const existing = await Warehouse.findOne({ name, deletedAt: null });
        if (existing) return error(res, 400, "Warehouse with this name already exists");

        const warehouse = await Warehouse.create({
            name, location, capacity,
            currentLoad: 0,
            description,
            createdBy: req.user.userId
        });

        await logAudit({
            action: "CREATE",
            entity: "Warehouse",
            entityId: warehouse._id,
            performedBy: req.user.userId,
            after: warehouse.toObject(),
            req
        });

        return success(res, "Warehouse created successfully", warehouse);
    } catch (err) {
        return error(res, 500, "Failed to create warehouse", err.message);
    }
};

// PUT /api/admin/warehouses/:id
export const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid warehouse ID");

        const warehouse = await Warehouse.findOne({ _id: id, deletedAt: null });
        if (!warehouse) return error(res, 404, "Warehouse not found");

        const before = warehouse.toObject();

        const allowed = ["name", "location", "capacity", "description"];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) warehouse[field] = req.body[field];
        });

        // Ensure capacity is not below currentLoad
        if (warehouse.capacity < warehouse.currentLoad) {
            return error(res, 400, "Capacity cannot be less than current load");
        }

        await warehouse.save();

        await logAudit({
            action: "UPDATE",
            entity: "Warehouse",
            entityId: warehouse._id,
            performedBy: req.user.userId,
            before,
            after: warehouse.toObject(),
            req
        });

        return success(res, "Warehouse updated successfully", warehouse);
    } catch (err) {
        return error(res, 500, "Failed to update warehouse", err.message);
    }
};

// DELETE /api/admin/warehouses/:id  (soft delete — consistent with other entities)
export const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid warehouse ID");

        const warehouse = await Warehouse.findOne({ _id: id, deletedAt: null });
        if (!warehouse) return error(res, 404, "Warehouse not found");

        if (warehouse.currentLoad > 0) {
            return error(res, 400, "Cannot delete warehouse with existing inventory. Dispatch all items first.");
        }

        const before = warehouse.toObject();
        await warehouse.softDelete(req.user.userId);

        await logAudit({
            action: "DELETE",
            entity: "Warehouse",
            entityId: warehouse._id,
            performedBy: req.user.userId,
            before,
            reason: reason || null,
            req
        });

        return success(res, "Warehouse deleted successfully");
    } catch (err) {
        return error(res, 500, "Failed to delete warehouse", err.message);
    }
};

// POST /api/admin/warehouses/receive
export const receiveOil = async (req, res) => {
    try {
        const { warehouseId, equipmentId, quantity, supplierOrDestination, actionDate, note } = req.body;

        if (!warehouseId || !quantity || !supplierOrDestination) {
            return error(res, 400, "warehouseId, quantity, supplierOrDestination are required");
        }
        if (Number(quantity) <= 0) {
            return error(res, 400, "Quantity must be greater than 0");
        }

        if (!mongoose.Types.ObjectId.isValid(warehouseId)) return error(res, 400, "Invalid warehouse ID");
        if (equipmentId && !mongoose.Types.ObjectId.isValid(equipmentId)) {
            return error(res, 400, "Invalid equipment ID");
        }

        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) return error(res, 404, "Warehouse not found");

        // SRS §4.2: Explicit soft-delete and inactive guards (defence-in-depth)
        if (warehouse.deletedAt || warehouse.status === 'inactive') {
            return error(res, 400, "Cannot receive into an inactive or deleted warehouse");
        }

        // SRS §4.3: CRITICAL - Explicit capacity overflow guard
        if (Number(warehouse.currentLoad) + Number(quantity) > Number(warehouse.capacity)) {
            return error(res, 400, `Capacity exceeded. Current: ${warehouse.currentLoad}, Available: ${warehouse.capacity - warehouse.currentLoad}, Requested: ${quantity}`);
        }

        // SRS §4.3: Verify equipment exists if provided
        if (equipmentId) {
            const equipment = await Equipment.findOne({ _id: equipmentId, deletedAt: null });
            if (!equipment) {
                return error(res, 404, "Equipment not found or has been deleted");
            }
        }

        warehouse.currentLoad += Number(quantity);
        await warehouse.save();

        const log = await InventoryLog.create({
            warehouseId, equipmentId, type: "RECEIVE",
            quantity, supplierOrDestination,
            actionDate: actionDate || new Date(),
            userId: req.user.userId,
            note
        });

        await logAudit({
            action: "RECEIVE_INVENTORY",
            entity: "Warehouse",
            entityId: warehouse._id,
            performedBy: req.user.userId,
            after: { warehouseId, quantity, supplierOrDestination, newLoad: warehouse.currentLoad },
            req
        });

        return success(res, "Inventory received successfully", { warehouse, log });
    } catch (err) {
        return error(res, 500, "Failed to receive inventory", err.message);
    }
};

// POST /api/admin/warehouses/dispatch
export const dispatch = async (req, res) => {
    try {
        const { warehouseId, equipmentId, quantity, supplierOrDestination, actionDate, note } = req.body;

        if (!warehouseId || !quantity || !supplierOrDestination) {
            return error(res, 400, "warehouseId, quantity, supplierOrDestination are required");
        }
        if (Number(quantity) <= 0) {
            return error(res, 400, "Quantity must be greater than 0");
        }

        if (!mongoose.Types.ObjectId.isValid(warehouseId)) return error(res, 400, "Invalid warehouse ID");
        if (equipmentId && !mongoose.Types.ObjectId.isValid(equipmentId)) {
            return error(res, 400, "Invalid equipment ID");
        }

        // SRS §4.3: Verify equipment exists if provided
        if (equipmentId) {
            const equipment = await Equipment.findOne({ _id: equipmentId, deletedAt: null });
            if (!equipment) {
                return error(res, 404, "Equipment not found or has been deleted");
            }
        }

        const warehouse = await Warehouse.findOne({ _id: warehouseId, deletedAt: null });
        if (!warehouse) return error(res, 404, "Warehouse not found");

        // SRS §4.2: Block inactive/decommissioned warehouses from dispatching inventory
        if (warehouse.status !== "active") {
            return error(res, 400, `Cannot dispatch inventory from an inactive warehouse (status: '${warehouse.status}'). Activate the warehouse first.`);
        }

        // SRS §4.3: explicit underflow guard — result must never go below zero
        if (warehouse.currentLoad - Number(quantity) < 0) {
            return error(res, 400, `Insufficient inventory. Current load: ${warehouse.currentLoad}, requested: ${quantity}`);
        }

        warehouse.currentLoad -= Number(quantity);
        await warehouse.save();

        const log = await InventoryLog.create({
            warehouseId, equipmentId, type: "DISPATCH",
            quantity, supplierOrDestination,
            actionDate: actionDate || new Date(),
            userId: req.user.userId,
            note
        });

        await logAudit({
            action: "DISPATCH_INVENTORY",
            entity: "Warehouse",
            entityId: warehouse._id,
            performedBy: req.user.userId,
            after: { warehouseId, quantity, supplierOrDestination, newLoad: warehouse.currentLoad },
            req
        });

        return success(res, "Inventory dispatched successfully", { warehouse, log });
    } catch (err) {
        return error(res, 500, "Failed to dispatch inventory", err.message);
    }
};

// GET /api/admin/warehouses/:id/logs
export const getWarehouseLogs = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return error(res, 400, "Invalid warehouse ID");

        const warehouse = await Warehouse.findById(id);
        if (!warehouse) return error(res, 404, "Warehouse not found");

        const logs = await InventoryLog.find({ warehouseId: id })
            .populate("userId", "name email")
            .populate("equipmentId", "name serial")
            .sort({ actionDate: -1 });

        return success(res, "Inventory logs retrieved successfully", logs);
    } catch (err) {
        return error(res, 500, "Failed to retrieve inventory logs", err.message);
    }
};
