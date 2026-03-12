import Sensor from "../../models/engineer/sensor.model.js";
import Equipment from "../../models/engineer/equipment.model.js";
import { success, error } from "../../utils/response.js";

// Get real-time sensor data
export const getRealTimeSensorData = async (req, res) => {
    try {
        const { equipmentId, type, location, status, limit = 100, page = 1 } = req.query;

        // Build query
        let query = {
            deletedAt: null,
            isActive: true
        };

        // Apply filters
        if (equipmentId) {
            query.equipmentId = equipmentId;
        }

        if (type) {
            query.type = type;
        }

        if (location) {
            query.location = new RegExp(location, 'i');
        }

        if (status) {
            query.status = status;
        }

        // Pagination
        const limitNum = Math.min(parseInt(limit) || 100, 500);
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const skip = (pageNum - 1) * limitNum;

        // Get sensors with real-time data
        const sensors = await Sensor.find(query)
            .populate('equipmentId', 'name type location status')
            .populate('createdBy updatedBy', 'name email')
            .sort({ 'currentReading.timestamp': -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const totalCount = await Sensor.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

        // Transform data for real-time display
        const realTimeData = sensors.map(sensor => {
            const reading = sensor.currentReading;
            const equipment = sensor.equipmentId;

            // Calculate status indicators
            const isOnline = sensor.status === 'online';
            const hasActiveAlarms = sensor.activeAlarms && sensor.activeAlarms.length > 0;
            const isCalibrationDue = sensor.calibration?.status === 'overdue' || sensor.calibration?.status === 'due-soon';

            // Determine overall health
            let health = 'good';
            if (!isOnline) health = 'offline';
            else if (hasActiveAlarms) health = 'alarm';
            else if (isCalibrationDue) health = 'warning';

            return {
                sensorId: sensor._id,
                sensorCode: sensor.sensorCode,
                name: sensor.name,
                type: sensor.type,

                // Equipment information
                equipment: equipment ? {
                    id: equipment._id,
                    name: equipment.name,
                    type: equipment.type,
                    location: equipment.location,
                    status: equipment.status
                } : null,

                location: sensor.location,

                // Real-time reading
                currentReading: {
                    value: reading.value,
                    unit: reading.unit,
                    timestamp: reading.timestamp,
                    quality: reading.quality,
                    formattedValue: `${reading.value} ${reading.unit}`
                },

                // Status and health
                status: sensor.status,
                health,
                isOnline,

                // Thresholds and alarms
                thresholds: sensor.thresholds,
                alarmStatus: sensor.alarmStatus || 'normal',
                activeAlarms: sensor.activeAlarms || [],
                alarmCount: (sensor.activeAlarms || []).length,

                // Calibration status
                calibration: {
                    status: sensor.calibration?.status || 'unknown',
                    lastDate: sensor.calibration?.lastCalibrationDate,
                    nextDate: sensor.calibration?.nextCalibrationDate,
                    daysRemaining: sensor.calibrationDaysRemaining
                },

                // Technical specs
                configuration: {
                    range: sensor.configuration?.range,
                    accuracy: sensor.configuration?.accuracy,
                    resolution: sensor.configuration?.resolution
                },

                // Communication
                communication: {
                    protocol: sensor.communication?.protocol,
                    updateRate: sensor.communication?.updateRate
                },

                // Manufacturer info
                manufacturer: sensor.manufacturer,
                model: sensor.model,
                serialNumber: sensor.serialNumber,

                // Timestamps
                lastUpdated: reading.timestamp,
                installationDate: sensor.installationDate
            };
        });

        // Calculate summary statistics
        const summary = {
            totalSensors: totalCount,
            onlineSensors: realTimeData.filter(s => s.isOnline).length,
            sensorsWithAlarms: realTimeData.filter(s => s.alarmCount > 0).length,
            sensorTypes: [...new Set(realTimeData.map(s => s.type))],
            locations: [...new Set(realTimeData.map(s => s.location))],
            lastUpdate: new Date()
        };

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Real-time sensor data retrieved successfully", {
            sensors: realTimeData,
            summary,
            pagination,
            filters: {
                equipmentId,
                type,
                location,
                status
            }
        });

    } catch (err) {
        return error(res, 500, "Error fetching real-time sensor data", err.message);
    }
};

// Get sensor trends and historical data
export const getSensorTrends = async (req, res) => {
    try {
        const { id } = req.params;
        const { period = '24h', interval = '1h' } = req.query;

        const sensor = await Sensor.findById(id)
            .populate('equipmentId', 'name location')
            .lean();

        if (!sensor) {
            return error(res, 404, "Sensor not found");
        }

        // Calculate time range based on period
        const now = new Date();
        let startTime;

        switch (period) {
            case '1h':
                startTime = new Date(now - 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(now - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now - 24 * 60 * 60 * 1000);
        }

        // Filter historical readings
        const historicalData = sensor.historicalReadings
            .filter(reading => reading.timestamp >= startTime)
            .sort((a, b) => a.timestamp - b.timestamp);

        // Calculate statistics
        const values = historicalData.map(r => r.value).filter(v => !isNaN(v));
        const stats = values.length > 0 ? {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            count: values.length,
            latest: values[values.length - 1]
        } : null;

        return success(res, "Sensor trends retrieved successfully", {
            sensor: {
                id: sensor._id,
                name: sensor.name,
                type: sensor.type,
                equipment: sensor.equipmentId,
                location: sensor.location,
                unit: sensor.currentReading.unit
            },
            period,
            timeRange: {
                from: startTime,
                to: now
            },
            data: historicalData,
            statistics: stats,
            thresholds: sensor.thresholds
        });

    } catch (err) {
        return error(res, 500, "Error fetching sensor trends", err.message);
    }
};

// Update sensor reading (for simulation or manual entry)
export const updateSensorReading = async (req, res) => {
    try {
        const { id } = req.params;
        const { value, quality = 'good' } = req.body;

        if (typeof value !== 'number') {
            return error(res, 400, "Value must be a number");
        }

        const sensor = await Sensor.updateReading(id, value, quality);

        return success(res, "Sensor reading updated successfully", {
            sensorId: sensor._id,
            sensorCode: sensor.sensorCode,
            currentReading: sensor.currentReading,
            alarmStatus: sensor.alarmStatus,
            activeAlarms: sensor.activeAlarms.slice(-5), // Last 5 alarms
            thresholds: sensor.thresholds
        });

    } catch (err) {
        return error(res, 500, "Error updating sensor reading", err.message);
    }
};

// Get sensor alarm summary
export const getSensorAlarms = async (req, res) => {
    try {
        const { severity, acknowledged, limit = 50 } = req.query;

        let matchStage = {
            deletedAt: null,
            isActive: true,
            'activeAlarms.0': { $exists: true } // Has at least one active alarm
        };

        const pipeline = [
            { $match: matchStage },
            { $unwind: '$activeAlarms' },
            {
                $lookup: {
                    from: 'equipment',
                    localField: 'equipmentId',
                    foreignField: '_id',
                    as: 'equipment'
                }
            },
            { $unwind: { path: '$equipment', preserveNullAndEmptyArrays: true } }
        ];

        // Apply severity filter
        if (severity) {
            pipeline.push({
                $match: { 'activeAlarms.type': severity }
            });
        }

        // Apply acknowledged filter
        if (typeof acknowledged === 'string') {
            pipeline.push({
                $match: { 'activeAlarms.acknowledged': acknowledged === 'true' }
            });
        }

        // Sort and limit
        pipeline.push(
            { $sort: { 'activeAlarms.timestamp': -1 } },
            { $limit: parseInt(limit) }
        );

        // Project final structure
        pipeline.push({
            $project: {
                sensorId: '$_id',
                sensorCode: 1,
                sensorName: '$name',
                sensorType: '$type',
                location: 1,
                equipment: {
                    id: '$equipment._id',
                    name: '$equipment.name',
                    type: '$equipment.type',
                    location: '$equipment.location'
                },
                alarm: '$activeAlarms',
                currentReading: 1,
                thresholds: 1
            }
        });

        const alarms = await Sensor.aggregate(pipeline);

        // Get alarm summary statistics
        const totalAlarmsQuery = await Sensor.aggregate([
            { $match: { deletedAt: null, isActive: true } },
            { $unwind: { path: '$activeAlarms', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$activeAlarms.type',
                    count: { $sum: { $cond: [{ $ifNull: ['$activeAlarms', false] }, 1, 0] } }
                }
            }
        ]);

        const alarmSummary = {
            total: alarms.length,
            critical: totalAlarmsQuery.find(a => a._id === 'critical')?.count || 0,
            alarm: totalAlarmsQuery.find(a => a._id === 'alarm')?.count || 0,
            warning: totalAlarmsQuery.find(a => a._id === 'warning')?.count || 0,
            acknowledged: alarms.filter(a => a.alarm.acknowledged).length,
            unacknowledged: alarms.filter(a => !a.alarm.acknowledged).length
        };

        return success(res, "Sensor alarms retrieved successfully", {
            alarms,
            summary: alarmSummary,
            filters: { severity, acknowledged, limit }
        });

    } catch (err) {
        return error(res, 500, "Error fetching sensor alarms", err.message);
    }
};

// Acknowledge sensor alarm
export const acknowledgeSensorAlarm = async (req, res) => {
    try {
        const { id, alarmId } = req.params;
        const { note } = req.body;

        const sensor = await Sensor.findById(id);
        if (!sensor) {
            return error(res, 404, "Sensor not found");
        }

        const alarm = sensor.activeAlarms.id(alarmId);
        if (!alarm) {
            return error(res, 404, "Alarm not found");
        }

        if (alarm.acknowledged) {
            return error(res, 400, "Alarm already acknowledged");
        }

        // Acknowledge the alarm
        alarm.acknowledged = true;
        alarm.acknowledgedBy = req.user.userId;
        alarm.acknowledgedAt = new Date();
        if (note) {
            alarm.acknowledgmentNote = note;
        }

        await sensor.save();

        return success(res, "Alarm acknowledged successfully", {
            sensorId: sensor._id,
            sensorCode: sensor.sensorCode,
            alarmId: alarm._id,
            acknowledgedAt: alarm.acknowledgedAt,
            acknowledgedBy: alarm.acknowledgedBy
        });

    } catch (err) {
        return error(res, 500, "Error acknowledging alarm", err.message);
    }
};

// Generate sensor dashboard data
export const getSensorDashboard = async (req, res) => {
    try {
        const { timeRange = '24h' } = req.query;

        // Get overall sensor statistics
        const totalSensors = await Sensor.countDocuments({ deletedAt: null, isActive: true });
        const onlineSensors = await Sensor.countDocuments({
            deletedAt: null,
            isActive: true,
            status: 'online'
        });

        // Get sensors by type
        const sensorsByType = await Sensor.aggregate([
            { $match: { deletedAt: null, isActive: true } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    online: {
                        $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Get alarm statistics
        const alarmStats = await Sensor.aggregate([
            { $match: { deletedAt: null, isActive: true } },
            { $unwind: { path: '$activeAlarms', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$activeAlarms.type',
                    count: { $sum: { $cond: [{ $ifNull: ['$activeAlarms', false] }, 1, 0] } }
                }
            }
        ]);

        // Get calibration status
        const calibrationStats = await Sensor.aggregate([
            { $match: { deletedAt: null, isActive: true } },
            {
                $group: {
                    _id: '$calibration.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent alarm activity
        const recentAlarms = await Sensor.aggregate([
            { $match: { deletedAt: null, isActive: true } },
            { $unwind: '$activeAlarms' },
            { $sort: { 'activeAlarms.timestamp': -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'equipment',
                    localField: 'equipmentId',
                    foreignField: '_id',
                    as: 'equipment'
                }
            },
            {
                $project: {
                    sensorName: '$name',
                    sensorType: '$type',
                    equipment: { $arrayElemAt: ['$equipment.name', 0] },
                    location: 1,
                    alarm: '$activeAlarms'
                }
            }
        ]);

        const dashboard = {
            overview: {
                totalSensors,
                onlineSensors,
                offlineSensors: totalSensors - onlineSensors,
                availabilityRate: totalSensors > 0 ? (onlineSensors / totalSensors * 100).toFixed(1) : 0
            },

            sensorTypes: sensorsByType,

            alarms: {
                critical: alarmStats.find(a => a._id === 'critical')?.count || 0,
                alarm: alarmStats.find(a => a._id === 'alarm')?.count || 0,
                warning: alarmStats.find(a => a._id === 'warning')?.count || 0,
                total: alarmStats.reduce((sum, a) => sum + (a.count || 0), 0)
            },

            calibration: {
                current: calibrationStats.find(c => c._id === 'current')?.count || 0,
                dueSoon: calibrationStats.find(c => c._id === 'due-soon')?.count || 0,
                overdue: calibrationStats.find(c => c._id === 'overdue')?.count || 0
            },

            recentActivity: recentAlarms,

            timestamp: new Date()
        };

        return success(res, "Sensor dashboard data retrieved successfully", dashboard);

    } catch (err) {
        return error(res, 500, "Error generating sensor dashboard", err.message);
    }
};
