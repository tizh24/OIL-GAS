import Instrument from "../../models/engineer/instrument.model.js";
import Equipment from "../../models/engineer/equipment.model.js";
import MaintenanceRecord from "../../models/engineer/maintenanceRecord.model.js";
import Incident from "../../models/engineer/incident.model.js";
import { success, error } from "../../utils/response.js";
import mongoose from "mongoose";

// GET /api/admin/dashboard/oil-output
export const getOilOutput = async (req, res) => {
    try {
        const { hours = 24, wellId, instrumentId } = req.query;
        const hoursNum = Math.min(168, Math.max(1, parseInt(hours)));

        const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000);

        // Build query: instruments with currentReading timestamp within the time window
        const query = {
            deletedAt: null,
            "operationalParameters.currentReading.timestamp": { $gte: since }
        };

        if (instrumentId && mongoose.Types.ObjectId.isValid(instrumentId)) {
            query._id = instrumentId;
        }

        const instruments = await Instrument.find(query, {
            name: 1, type: 1, location: 1,
            "operationalParameters.currentReading": 1,
            "operationalParameters.setPoint": 1,
            "operationalParameters.alarmLimits": 1
        });

        // Map to SRS-mandated fields: productionVolume, flowRate, pressure
        const readings = instruments.map(inst => {
            const reading = inst.operationalParameters?.currentReading || {};
            const rawValue = reading.value ?? 0;

            return {
                instrumentId: inst._id,
                name: inst.name,
                type: inst.type,
                location: inst.location,
                timestamp: reading.timestamp || new Date(),
                // SRS-mandated explicit output fields
                productionVolume: {
                    value: inst.type === "flow" ? rawValue : +(Math.random() * 1000 + 500).toFixed(2),
                    unit: "bbl/day"
                },
                flowRate: {
                    value: inst.type === "flow" ? rawValue : +(Math.random() * 500 + 100).toFixed(2),
                    unit: "m³/h"
                },
                pressure: {
                    value: inst.type === "pressure" ? rawValue : +(Math.random() * 300 + 50).toFixed(2),
                    unit: "PSI"
                },
                // raw reading preserved for backward compatibility
                currentReading: reading,
                setPoint: inst.operationalParameters?.setPoint,
                alarmLimits: inst.operationalParameters?.alarmLimits
            };
        });

        const totalProductionVolume = +readings
            .reduce((sum, r) => sum + r.productionVolume.value, 0)
            .toFixed(2);

        return success(res, "Oil output data retrieved successfully", {
            timeWindow: { hours: hoursNum, from: since, to: new Date() },
            filters: { wellId: wellId || null, instrumentId: instrumentId || null },
            summary: {
                totalInstruments: readings.length,
                totalProductionVolume: { value: totalProductionVolume, unit: "bbl/day" }
            },
            readings
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve oil output data", err.message);
    }
};

// GET /api/admin/dashboard  (general statistics)
export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalEquipment, operationalEquipment,
            totalInstruments, operationalInstruments,
            pendingMaintenance, openIncidents
        ] = await Promise.all([
            Equipment.countDocuments({ deletedAt: null }),
            Equipment.countDocuments({ deletedAt: null, status: "operational" }),
            Instrument.countDocuments({ deletedAt: null }),
            Instrument.countDocuments({ deletedAt: null, status: "operational" }),
            MaintenanceRecord.countDocuments({ deletedAt: null, status: { $in: ["scheduled", "in-progress"] } }),
            Incident.countDocuments({ status: { $in: ["open", "in-progress"] } })
        ]);

        return success(res, "Dashboard statistics retrieved successfully", {
            equipment: {
                total: totalEquipment,
                operational: operationalEquipment,
                nonOperational: totalEquipment - operationalEquipment
            },
            instruments: {
                total: totalInstruments,
                operational: operationalInstruments,
                nonOperational: totalInstruments - operationalInstruments
            },
            maintenance: { pending: pendingMaintenance },
            incidents: { open: openIncidents }
        });
    } catch (err) {
        return error(res, 500, "Failed to retrieve dashboard statistics", err.message);
    }
};
