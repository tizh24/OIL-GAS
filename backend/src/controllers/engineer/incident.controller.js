import Incident, { Alert } from "../../models/engineer/incident.model.js";
import { success, error } from "../../utils/response.js";

// Get incidents list with filters and pagination
export const getIncidents = async (req, res) => {
    try {
        const {
            severity,
            status,
            instrument,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) {
            return error(res, 400, "Page must be >= 1");
        }

        if (limitNum > 100) {
            return error(res, 400, "Limit must be <= 100");
        }

        // Build filter object
        const filters = {};
        if (severity) filters.severity = severity;
        if (status) filters.status = status;
        if (instrument) filters.instrument = instrument;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        // Get incidents with filters and pagination
        const incidents = await Incident.findWithFilters(filters, {
            page: pageNum,
            limit: limitNum
        });

        // Get total count for pagination
        const query = { deletedAt: null };
        if (severity) query.severity = severity;
        if (status) query.status = status;
        if (instrument) query.instrument = instrument;
        if (startDate || endDate) {
            query.reportedAt = {};
            if (startDate) query.reportedAt.$gte = new Date(startDate);
            if (endDate) query.reportedAt.$lte = new Date(endDate);
        }

        const totalCount = await Incident.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Incidents retrieved successfully", {
            incidents,
            pagination
        });
    } catch (err) {
        console.error("Get incidents error:", err);
        return error(res, 500, "Failed to retrieve incidents", err.message);
    }
};

// Get single incident by ID with full details
export const getIncidentById = async (req, res) => {
    try {
        const { id } = req.params;

        const incident = await Incident.findOne({
            _id: id,
            deletedAt: null
        })
            .populate('reportedBy', 'name email userCode role department')
            .populate('assignedTo', 'name email userCode role department')
            .populate('equipment', 'name type equipmentCode status location')
            .populate('instrument', 'name type instrumentCode status location')
            .populate('comments.user', 'name userCode');

        if (!incident) {
            return error(res, 404, "Incident not found");
        }

        return success(res, "Incident retrieved successfully", incident);
    } catch (err) {
        console.error("Get incident by ID error:", err);
        return error(res, 500, "Failed to retrieve incident", err.message);
    }
};

// Create new incident
export const createIncident = async (req, res) => {
    try {
        const {
            title,
            description,
            severity,
            type,
            location,
            equipment,
            instrument,
            assignedTo,
            priority
        } = req.body; const incidentData = {
            title,
            description,
            severity,
            type,
            location,
            reportedBy: req.user.userId,
            priority: priority || 'medium'
        };

        // Add optional fields
        if (equipment) incidentData.equipment = equipment;
        if (instrument) incidentData.instrument = instrument;
        if (assignedTo) incidentData.assignedTo = assignedTo;

        const incident = await Incident.create(incidentData);

        // Populate response data
        const populatedIncident = await Incident.findById(incident._id)
            .populate('reportedBy', 'name email userCode')
            .populate('assignedTo', 'name email userCode')
            .populate('equipment', 'name type equipmentCode')
            .populate('instrument', 'name type instrumentCode');

        return success(res, "Incident created successfully", populatedIncident);
    } catch (err) {
        console.error("Create incident error:", err);
        return error(res, 500, "Failed to create incident", err.message);
    }
};

// Update incident
export const updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData.incidentCode;
        delete updateData.reportedBy;
        delete updateData.reportedAt;
        delete updateData.createdAt;

        // If status is being set to resolved, add resolvedAt timestamp
        if (updateData.status === 'resolved' && updateData.resolution) {
            updateData.resolvedAt = new Date();
        }

        const incident = await Incident.findOneAndUpdate(
            { _id: id, deletedAt: null },
            updateData,
            { new: true, runValidators: true }
        )
            .populate('reportedBy', 'name email userCode')
            .populate('assignedTo', 'name email userCode')
            .populate('equipment', 'name type equipmentCode')
            .populate('instrument', 'name type instrumentCode');

        if (!incident) {
            return error(res, 404, "Incident not found");
        }

        return success(res, "Incident updated successfully", incident);
    } catch (err) {
        console.error("Update incident error:", err);
        return error(res, 500, "Failed to update incident", err.message);
    }
};

// Add comment to incident
export const addIncidentComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        if (!comment || comment.trim().length === 0) {
            return error(res, 400, "Comment is required");
        }

        const incident = await Incident.findOneAndUpdate(
            { _id: id, deletedAt: null },
            {
                $push: {
                    comments: {
                        user: req.user.userId,
                        comment: comment.trim(),
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        )
            .populate('comments.user', 'name userCode');

        if (!incident) {
            return error(res, 404, "Incident not found");
        }

        // Return just the new comment
        const newComment = incident.comments[incident.comments.length - 1];

        return success(res, "Comment added successfully", newComment);
    } catch (err) {
        console.error("Add incident comment error:", err);
        return error(res, 500, "Failed to add comment", err.message);
    }
};

// Get alerts list with filters and pagination
export const getAlerts = async (req, res) => {
    try {
        const {
            severity,
            acknowledged,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1) {
            return error(res, 400, "Page must be >= 1");
        }

        if (limitNum > 100) {
            return error(res, 400, "Limit must be <= 100");
        }

        // Build filter object
        const filters = {};
        if (severity) filters.severity = severity;
        if (acknowledged !== undefined) {
            filters.acknowledged = acknowledged === 'true';
        }
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        // Get alerts with filters and pagination
        const alerts = await Alert.findWithFilters(filters, {
            page: pageNum,
            limit: limitNum
        });

        // Get total count for pagination
        const query = { deletedAt: null };
        if (severity) query.severity = severity;
        if (acknowledged !== undefined) {
            query.acknowledged = acknowledged === 'true';
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const totalCount = await Alert.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Alerts retrieved successfully", {
            alerts,
            pagination
        });
    } catch (err) {
        console.error("Get alerts error:", err);
        return error(res, 500, "Failed to retrieve alerts", err.message);
    }
};

// Acknowledge alert
export const acknowledgeAlert = async (req, res) => {
    try {
        const { id } = req.params;

        // Find alert and check if it exists and not already acknowledged
        const alert = await Alert.findOne({
            _id: id,
            deletedAt: null
        });

        if (!alert) {
            return error(res, 404, "Alert not found");
        }

        if (alert.acknowledged) {
            return error(res, 400, "Alert is already acknowledged", {
                acknowledgedBy: alert.acknowledgedBy,
                acknowledgedAt: alert.acknowledgedAt
            });
        }

        // Acknowledge the alert
        const updatedAlert = await Alert.findByIdAndUpdate(
            id,
            {
                acknowledged: true,
                acknowledgedBy: req.user.userId,
                acknowledgedAt: new Date()
            },
            { new: true }
        )
            .populate('acknowledgedBy', 'name email userCode')
            .populate('source.equipment', 'name type equipmentCode')
            .populate('source.instrument', 'name type instrumentCode');

        return success(res, "Alert acknowledged successfully", updatedAlert);
    } catch (err) {
        console.error("Acknowledge alert error:", err);
        return error(res, 500, "Failed to acknowledge alert", err.message);
    }
};

// Create new alert (for system/admin use)
export const createAlert = async (req, res) => {
    try {
        const {
            title,
            message,
            severity,
            type,
            source,
            triggerValue,
            thresholdValue,
            unit
        } = req.body; const alertData = {
            title,
            message,
            severity,
            type
        };

        // Add optional fields
        if (source) alertData.source = source;

        const alert = await Alert.create(alertData);

        // Populate response data
        const populatedAlert = await Alert.findById(alert._id)
            .populate('source.equipment', 'name type equipmentCode')
            .populate('source.instrument', 'name type instrumentCode');

        return success(res, "Alert created successfully", populatedAlert);
    } catch (err) {
        console.error("Create alert error:", err);
        return error(res, 500, "Failed to create alert", err.message);
    }
};

// Bulk acknowledge multiple alerts
export const bulkAcknowledgeAlerts = async (req, res) => {
    try {
        const { alertIds, acknowledgmentNote } = req.body;
        const userId = req.user.userId;

        if (!Array.isArray(alertIds) || alertIds.length === 0) {
            return error(res, 400, "Alert IDs array is required");
        }

        if (alertIds.length > 50) {
            return error(res, 400, "Cannot acknowledge more than 50 alerts at once");
        }

        const results = {
            acknowledged_count: 0,
            failed_count: 0,
            failed_alerts: []
        };

        // Process each alert
        for (const alertId of alertIds) {
            try {
                const alert = await Alert.findOne({
                    _id: alertId,
                    deletedAt: null
                });

                if (!alert) {
                    results.failed_count++;
                    results.failed_alerts.push({
                        alertId,
                        reason: "Alert not found"
                    });
                    continue;
                }                // Check if already acknowledged
                if (alert.acknowledged) {
                    results.failed_count++;
                    results.failed_alerts.push({
                        alertId,
                        reason: "Alert already acknowledged"
                    });
                    continue;
                }

                // Acknowledge the alert
                alert.acknowledged = true;
                alert.acknowledgedAt = new Date();
                alert.acknowledgedBy = userId;
                if (acknowledgmentNote) {
                    alert.acknowledgmentNote = acknowledgmentNote;
                }

                await alert.save();
                results.acknowledged_count++;

            } catch (alertError) {
                console.error(`Error acknowledging alert ${alertId}:`, alertError);
                results.failed_count++;
                results.failed_alerts.push({
                    alertId,
                    reason: "Processing error: " + alertError.message
                });
            }
        }

        const message = results.acknowledged_count > 0
            ? `Successfully acknowledged ${results.acknowledged_count} alert(s)${results.failed_count > 0 ? `, ${results.failed_count} failed` : ''}`
            : "No alerts were acknowledged";

        return success(res, 200, message, results);

    } catch (err) {
        console.error("Bulk acknowledge alerts error:", err);
        return error(res, 500, "Failed to acknowledge alerts", err.message);
    }
};

// Delete incident (soft delete)
export const deleteIncident = async (req, res) => {
    try {
        const { id } = req.params;

        const incident = await Incident.findOne({
            _id: id,
            deletedAt: null
        });

        if (!incident) {
            return error(res, 404, "Incident not found");
        }

        // Soft delete
        incident.deletedAt = new Date();
        await incident.save();

        return success(res, 200, "Incident deleted successfully");

    } catch (err) {
        console.error("Delete incident error:", err);
        return error(res, 500, "Failed to delete incident", err.message);
    }
};

// Get incident comments
export const getIncidentComments = async (req, res) => {
    try {
        const { id } = req.params; const incident = await Incident.findOne({
            _id: id,
            deletedAt: null
        }).populate('comments.user', 'name email');

        if (!incident) {
            return error(res, 404, "Incident not found");
        }

        return success(res, 200, "Comments retrieved successfully", incident.comments);

    } catch (err) {
        console.error("Get incident comments error:", err);
        return error(res, 500, "Failed to get comments", err.message);
    }
};

// Get alert by ID
export const getAlertById = async (req, res) => {
    try {
        const { id } = req.params;

        const alert = await Alert.findOne({
            _id: id,
            deletedAt: null
        }).populate('acknowledgedBy', 'name email');

        if (!alert) {
            return error(res, 404, "Alert not found");
        }

        return success(res, 200, "Alert retrieved successfully", alert);

    } catch (err) {
        console.error("Get alert by ID error:", err);
        return error(res, 500, "Failed to get alert", err.message);
    }
};

// Update alert
export const updateAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const alert = await Alert.findOne({
            _id: id,
            deletedAt: null
        });

        if (!alert) {
            return error(res, 404, "Alert not found");
        }        // Update alert fields
        Object.assign(alert, updateData);

        // If acknowledged status is being changed, set acknowledgment time
        if (updateData.acknowledged === true && !alert.acknowledged) {
            alert.acknowledgedAt = new Date();
            alert.acknowledgedBy = req.user.userId;
        }

        await alert.save();

        // Populate acknowledgedBy for response
        await alert.populate('acknowledgedBy', 'name email');

        return success(res, 200, "Alert updated successfully", alert);

    } catch (err) {
        console.error("Update alert error:", err);
        return error(res, 500, "Failed to update alert", err.message);
    }
};

// Delete alert (soft delete)
export const deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;

        const alert = await Alert.findOne({
            _id: id,
            deletedAt: null
        });

        if (!alert) {
            return error(res, 404, "Alert not found");
        }

        // Soft delete
        alert.deletedAt = new Date();
        await alert.save();

        return success(res, 200, "Alert deleted successfully");

    } catch (err) {
        console.error("Delete alert error:", err);
        return error(res, 500, "Failed to delete alert", err.message);
    }
};