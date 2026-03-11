import express from "express";
import {
    register,
    login,
    refresh,
    logout,
    changePassword,
    verifyToken
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Protected routes
router.post("/change-password", protect, changePassword);
router.get("/verify", protect, verifyToken);

export default router;
