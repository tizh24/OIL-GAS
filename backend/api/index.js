import app from "../src/app.js";
import connectDB from "../src/config/db.js";
import "dotenv/config";

export default async function handler(req, res) {
    const isHealthCheck =
        req.url === "/api/health" ||
        req.url === "/api/health/" ||
        req.url?.startsWith("/api/health?");

    if (!isHealthCheck) {
        await connectDB();
    }

    return app(req, res);
}
