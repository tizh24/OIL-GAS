import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.route.js";
import { swaggerDocs } from "./config/swagger.js";
import authRoutes from "./routes/auth.route.js";
import engineerRoutes from "./routes/engineer/profile.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Oil & Gas Management API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/engineer", engineerRoutes);

swaggerDocs(app);

export default app;
