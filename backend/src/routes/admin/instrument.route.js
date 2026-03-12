import express from "express";
import {
    getAllInstruments,
    getInstrumentById,
    createInstrument,
    updateInstrument,
    deleteInstrument,
    assignEngineer,
    removeEngineer
} from "../../controllers/admin/instrument.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import {
    createInstrumentValidationSchema,
    updateInstrumentValidationSchema
} from "../../utils/validation.js";

const router = express.Router();

// Apply authentication and role-based access to all routes
router.use(protect);
router.use(allowRoles(["admin", "super_admin"]));

// Instrument CRUD routes
router.get("/", getAllInstruments);
router.get("/:id", getInstrumentById);
router.post("/", validateRequest(createInstrumentValidationSchema), createInstrument);
router.put("/:id", validateRequest(updateInstrumentValidationSchema), updateInstrument);
router.delete("/:id", deleteInstrument);

// Engineer assignment routes
router.post("/:id/engineers", assignEngineer);
router.delete("/:id/engineers/:engineerId", removeEngineer);

export default router;
