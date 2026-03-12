/**
 * Monitoring Controller – trả về dữ liệu vận hành mock (SRS §96, §150).
 * Production: thay bằng dữ liệu thật từ SCADA / IoT sensors.
 */

import { success, error } from "../../utils/response.js";

function randomInRange(min, max, decimals = 1) {
    const val = Math.random() * (max - min) + min;
    return parseFloat(val.toFixed(decimals));
}

// ── GET /api/admin/monitoring/oil-output ──────────────────────────────────────
export const getOilOutput = async (req, res) => {
    try {
        const data = {
            timestamp: new Date().toISOString(),
            production: {
                dailyVolume: { value: randomInRange(3800, 4800, 0), unit: "barrels/day" },
                monthlyVolume: { value: randomInRange(110000, 145000, 0), unit: "barrels/month" }
            },
            flowRates: {
                wellheadA: { value: randomInRange(140, 200, 1), unit: "m³/hour" },
                wellheadB: { value: randomInRange(100, 165, 1), unit: "m³/hour" },
                pipeline: { value: randomInRange(280, 360, 1), unit: "m³/hour" }
            },
            pressure: {
                wellhead: { value: randomInRange(1900, 2400, 0), unit: "psi" },
                separator: { value: randomInRange(500, 900, 0), unit: "psi" },
                pipeline: { value: randomInRange(800, 1200, 0), unit: "psi" },
                status: "NORMAL"
            },
            temperature: {
                wellhead: { value: randomInRange(72, 90, 1), unit: "°C" },
                separator: { value: randomInRange(50, 68, 1), unit: "°C" }
            },
            gasOilRatio: { value: randomInRange(800, 1200, 0), unit: "scf/bbl" },
            waterCut: { value: randomInRange(5, 25, 1), unit: "%" },
            systemStatus: "OPERATIONAL",
            alerts: []
        };

        // Simulte cảnh báo áp suất cao
        if (data.pressure.wellhead.value > 2300) {
            data.pressure.status = "WARNING";
            data.alerts.push({ level: "WARNING", message: "Wellhead pressure approaching upper limit" });
        }

        return success(res, "Oil output data retrieved successfully", data);
    } catch (err) {
        return error(res, 500, "Failed to retrieve monitoring data", err.message);
    }
};

// ── GET /api/admin/monitoring/dashboard ───────────────────────────────────────
export const getDashboard = async (req, res) => {
    try {
        const data = {
            timestamp: new Date().toISOString(),
            operationalEquipment: randomInRange(85, 98, 0),
            maintenancePending: Math.floor(randomInRange(2, 12, 0)),
            openIncidents: Math.floor(randomInRange(0, 8, 0)),
            criticalAlerts: Math.floor(randomInRange(0, 3, 0)),
            todayProduction: { value: randomInRange(3800, 4800, 0), unit: "barrels" },
            systemUptime: { value: randomInRange(97, 99.9, 2), unit: "%" }
        };

        return success(res, "Dashboard data retrieved", data);
    } catch (err) {
        return error(res, 500, "Failed to retrieve dashboard data", err.message);
    }
};
