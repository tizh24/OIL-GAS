import app from "../src/app.js";
import connectDB from "../src/config/db.js";
import "dotenv/config";

export default async function handler(req, res) {
    await connectDB();
    return app(req, res);
}
