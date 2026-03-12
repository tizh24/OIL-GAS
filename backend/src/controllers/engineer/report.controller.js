import Report from "../../models/engineer/report.model.js";
import Equipment from "../../models/engineer/equipment.model.js";
import Sensor from "../../models/engineer/sensor.model.js";
import Incident from "../../models/engineer/incident.model.js";
import MaintenanceRecord from "../../models/engineer/maintenanceRecord.model.js";
import { success, error } from "../../utils/response.js";
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

// Get report list with filters
export const getReportList = async (req, res) => {
    try {
        const {
            type,
            status,
            category,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = { deletedAt: null };

        if (type) query.type = type;
        if (status) query.status = status;
        if (category) query.category = category;

        // Pagination
        const limitNum = Math.min(parseInt(limit) || 10, 100);
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const skip = (pageNum - 1) * limitNum;

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Get reports with access control
        const reports = await Report.findByUserAccess(req.user.userId, query)
            .populate('updatedBy', 'name email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count
        const totalCount = await Report.countDocuments({
            ...query,
            $or: [
                { createdBy: req.user.userId },
                { visibility: 'public' },
                { 'accessPermissions.user': req.user.userId }
            ]
        });

        const totalPages = Math.ceil(totalCount / limitNum);

        // Transform reports data
        const reportsData = reports.map(report => ({
            id: report._id,
            reportCode: report.reportCode,
            title: report.title,
            type: report.type,
            category: report.category,
            description: report.description,

            dateRange: report.dateRange,
            format: report.format,
            template: report.template,

            status: report.status,
            progress: report.progress,

            fileInfo: report.status === 'completed' ? {
                fileName: report.fileName,
                fileSize: report.fileSize,
                fileSizeMB: report.fileSizeMB,
                downloadUrl: report.status === 'completed' ?
                    `/api/engineer/reports/${report._id}/download` : null
            } : null,

            generation: {
                startedAt: report.generationStartedAt,
                completedAt: report.generationCompletedAt,
                duration: report.generationDurationFormatted,
                errorMessage: report.errorMessage
            },

            usage: {
                downloadCount: report.downloadCount,
                viewCount: report.viewCount,
                lastAccessed: report.lastAccessedAt
            },

            schedule: report.schedule.enabled ? {
                frequency: report.schedule.frequency,
                nextRun: report.schedule.nextRunDate
            } : null,

            createdBy: report.createdBy,
            updatedBy: report.updatedBy,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            reportAge: report.reportAge,

            tags: report.tags,
            visibility: report.visibility
        }));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        return success(res, "Reports retrieved successfully", {
            reports: reportsData,
            pagination,
            filters: { type, status, category }
        });

    } catch (err) {
        return error(res, 500, "Error fetching reports", err.message);
    }
};

// Generate technical report
export const generateTechnicalReport = async (req, res) => {
    try {
        const {
            type,
            from,
            to,
            format = 'pdf',
            template = 'standard',
            title,
            description,
            filters = {},
            kpiMetrics = {},
            distribution = {}
        } = req.body;

        if (!type || !from || !to) {
            return error(res, 400, "Report type, from date, and to date are required");
        }

        // Validate date range
        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate >= toDate) {
            return error(res, 400, "Start date must be before end date");
        }

        // Create report record
        const reportData = {
            title: title || `${type.toUpperCase()} Report - ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`,
            type,
            category: 'technical',
            description: description || `Automated ${type} report generated for the period ${from} to ${to}`,
            dateRange: { from: fromDate, to: toDate },
            format,
            template,
            filters,
            kpiMetrics: type === 'kpi' ? { ...getDefaultKPIMetrics(), ...kpiMetrics } : undefined,
            distribution,
            status: 'pending',
            createdBy: req.user.userId
        };

        const report = new Report(reportData);
        await report.save();

        // Start report generation asynchronously
        generateReportAsync(report._id);

        return success(res, "Report generation initiated successfully", {
            reportId: report._id,
            reportCode: report.reportCode,
            status: report.status,
            estimatedTime: getEstimatedGenerationTime(type, format),
            statusUrl: `/api/engineer/reports/${report._id}/status`,
            downloadUrl: `/api/engineer/reports/${report._id}/download`
        });

    } catch (err) {
        return error(res, 500, "Error generating report", err.message);
    }
};

// Get report status
export const getReportStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findById(id)
            .populate('createdBy updatedBy', 'name email')
            .lean();

        if (!report) {
            return error(res, 404, "Report not found");
        }

        // Check access permissions
        if (!hasReportAccess(req.user.userId, report)) {
            return error(res, 403, "Access denied");
        }

        const status = {
            reportId: report._id,
            reportCode: report.reportCode,
            title: report.title,
            type: report.type,

            status: report.status,
            progress: report.progress,

            generation: {
                startedAt: report.generationStartedAt,
                completedAt: report.generationCompletedAt,
                duration: report.generationDurationFormatted,
                errorMessage: report.errorMessage
            },

            fileInfo: report.status === 'completed' ? {
                fileName: report.fileName,
                fileSize: report.fileSize,
                fileSizeMB: report.fileSizeMB,
                format: report.format
            } : null,

            isReady: report.status === 'completed',
            canDownload: report.status === 'completed' && report.filePath,

            createdBy: report.createdBy,
            createdAt: report.createdAt
        };

        return success(res, "Report status retrieved successfully", status);

    } catch (err) {
        return error(res, 500, "Error fetching report status", err.message);
    }
};

// Download report
export const downloadReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findById(id);
        if (!report) {
            return error(res, 404, "Report not found");
        }

        // Check access permissions
        if (!hasReportAccess(req.user.userId, report)) {
            return error(res, 403, "Access denied to download this report");
        }

        if (report.status !== 'completed') {
            return error(res, 400, "Report is not ready for download");
        }

        if (!report.filePath || !fs.existsSync(report.filePath)) {
            return error(res, 404, "Report file not found");
        }

        // Increment download count
        await report.incrementDownload();

        // Set appropriate headers
        const fileName = report.fileName || `${report.reportCode}.${report.format}`;
        const contentType = getContentType(report.format);

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', contentType);

        // Stream the file
        const fileStream = fs.createReadStream(report.filePath);
        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            if (!res.headersSent) {
                return error(res, 500, "Error streaming report file");
            }
        });

    } catch (err) {
        return error(res, 500, "Error downloading report", err.message);
    }
};

// Delete report
export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findById(id);
        if (!report) {
            return error(res, 404, "Report not found");
        }

        // Check permissions (only creator or admin can delete)
        if (report.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return error(res, 403, "Access denied to delete this report");
        }

        // Soft delete the report
        await report.softDelete(req.user.userId);

        // Optionally delete the physical file
        if (report.filePath && fs.existsSync(report.filePath)) {
            try {
                fs.unlinkSync(report.filePath);
            } catch (fileErr) {
                console.error('Error deleting report file:', fileErr);
            }
        }

        return success(res, "Report deleted successfully", {
            reportId: report._id,
            reportCode: report.reportCode
        });

    } catch (err) {
        return error(res, 500, "Error deleting report", err.message);
    }
};

// Helper Functions

// Generate report asynchronously
async function generateReportAsync(reportId) {
    try {
        const report = await Report.findById(reportId);
        if (!report) return;

        await report.updateStatus('generating', 10);

        // Generate report data based on type
        let reportData;
        switch (report.type) {
            case 'maintenance':
                reportData = await generateMaintenanceReportData(report);
                break;
            case 'incident':
                reportData = await generateIncidentReportData(report);
                break;
            case 'kpi':
                reportData = await generateKPIReportData(report);
                break;
            case 'sensor':
                reportData = await generateSensorReportData(report);
                break;
            case 'equipment':
                reportData = await generateEquipmentReportData(report);
                break;
            default:
                throw new Error('Invalid report type');
        }

        await report.updateStatus('generating', 60);

        // Generate file based on format
        let filePath;
        if (report.format === 'pdf') {
            filePath = await generatePDFReport(report, reportData);
        } else if (report.format === 'excel') {
            filePath = await generateExcelReport(report, reportData);
        } else if (report.format === 'csv') {
            filePath = await generateCSVReport(report, reportData);
        } else if (report.format === 'json') {
            filePath = await generateJSONReport(report, reportData);
        }

        await report.updateStatus('generating', 90);

        // Update report with file information
        const stats = fs.statSync(filePath);
        report.filePath = filePath;
        report.fileName = path.basename(filePath);
        report.fileSize = stats.size;
        report.reportData = report.format === 'json' ? reportData : undefined;
        report.dataSummary = {
            recordsProcessed: reportData.summary?.totalRecords || 0,
            equipmentCount: reportData.summary?.equipmentCount || 0,
            sensorCount: reportData.summary?.sensorCount || 0,
            dataQuality: 'good'
        };

        await report.updateStatus('completed', 100);

    } catch (err) {
        console.error('Report generation error:', err);
        await Report.findByIdAndUpdate(reportId, {
            status: 'failed',
            progress: 0,
            errorMessage: err.message,
            generationCompletedAt: new Date()
        });
    }
}

// Generate maintenance report data
async function generateMaintenanceReportData(report) {
    const { from, to } = report.dateRange;

    const maintenanceRecords = await MaintenanceRecord.find({
        scheduledDate: { $gte: from, $lte: to },
        deletedAt: null
    })
        .populate('equipment', 'name type location')
        .populate('engineerId', 'name email')
        .sort({ scheduledDate: -1 });

    const summary = {
        totalRecords: maintenanceRecords.length,
        completed: maintenanceRecords.filter(r => r.status === 'completed').length,
        pending: maintenanceRecords.filter(r => r.status === 'pending').length,
        inProgress: maintenanceRecords.filter(r => r.status === 'in-progress').length,
        cancelled: maintenanceRecords.filter(r => r.status === 'cancelled').length,

        totalCost: maintenanceRecords.reduce((sum, r) => sum + (r.cost?.total || 0), 0),
        totalHours: maintenanceRecords.reduce((sum, r) => sum + (r.actualHours || 0), 0),
        averageCost: 0,
        averageHours: 0
    };

    if (summary.totalRecords > 0) {
        summary.averageCost = summary.totalCost / summary.totalRecords;
        summary.averageHours = summary.totalHours / summary.totalRecords;
    }

    return {
        title: 'Maintenance Report',
        period: `${from.toLocaleDateString()} to ${to.toLocaleDateString()}`,
        summary,
        records: maintenanceRecords,
        generatedAt: new Date()
    };
}

// Generate incident report data
async function generateIncidentReportData(report) {
    const { from, to } = report.dateRange;

    const incidents = await Incident.find({
        reportedAt: { $gte: from, $lte: to },
        deletedAt: null
    })
        .populate('equipment', 'name type location')
        .populate('reportedBy assignedTo', 'name email')
        .sort({ reportedAt: -1 });

    const summary = {
        totalIncidents: incidents.length,
        critical: incidents.filter(i => i.severity === 'critical').length,
        high: incidents.filter(i => i.severity === 'high').length,
        medium: incidents.filter(i => i.severity === 'medium').length,
        low: incidents.filter(i => i.severity === 'low').length,

        open: incidents.filter(i => i.status === 'open').length,
        investigating: incidents.filter(i => i.status === 'investigating').length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
        closed: incidents.filter(i => i.status === 'closed').length
    };

    return {
        title: 'Incident Report',
        period: `${from.toLocaleDateString()} to ${to.toLocaleDateString()}`,
        summary,
        incidents,
        generatedAt: new Date()
    };
}

// Generate KPI report data
async function generateKPIReportData(report) {
    const { from, to } = report.dateRange;
    const metrics = report.kpiMetrics;

    // Calculate KPIs
    const totalEquipment = await Equipment.countDocuments({ deletedAt: null });
    const activeEquipment = await Equipment.countDocuments({
        deletedAt: null,
        status: 'operational'
    });

    const totalSensors = await Sensor.countDocuments({
        deletedAt: null,
        isActive: true
    });
    const onlineSensors = await Sensor.countDocuments({
        deletedAt: null,
        isActive: true,
        status: 'online'
    });

    const incidents = await Incident.countDocuments({
        reportedAt: { $gte: from, $lte: to },
        deletedAt: null
    });

    const safetyIncidents = await Incident.countDocuments({
        reportedAt: { $gte: from, $lte: to },
        type: 'safety_violation',
        deletedAt: null
    });

    const kpis = {
        availability: {
            value: totalEquipment > 0 ? (activeEquipment / totalEquipment * 100) : 0,
            target: metrics.availability?.target || 95,
            unit: '%'
        },
        sensorAvailability: {
            value: totalSensors > 0 ? (onlineSensors / totalSensors * 100) : 0,
            target: 98,
            unit: '%'
        },
        totalIncidents: {
            value: incidents,
            target: 0,
            unit: 'incidents'
        },
        safetyIncidents: {
            value: safetyIncidents,
            target: metrics.safetyIncidents?.target || 0,
            unit: 'incidents'
        }
    };

    return {
        title: 'KPI Report',
        period: `${from.toLocaleDateString()} to ${to.toLocaleDateString()}`,
        kpis,
        summary: {
            totalEquipment,
            activeEquipment,
            totalSensors,
            onlineSensors,
            totalIncidents: incidents,
            safetyIncidents
        },
        generatedAt: new Date()
    };
}

// Generate sensor report data
async function generateSensorReportData(report) {
    const { from, to } = report.dateRange;

    const sensors = await Sensor.find({
        deletedAt: null,
        isActive: true,
        'currentReading.timestamp': { $gte: from, $lte: to }
    })
        .populate('equipmentId', 'name type location')
        .sort({ type: 1, name: 1 });

    const summary = {
        totalSensors: sensors.length,
        sensorTypes: [...new Set(sensors.map(s => s.type))],
        onlineSensors: sensors.filter(s => s.status === 'online').length,
        sensorsWithAlarms: sensors.filter(s => s.activeAlarms && s.activeAlarms.length > 0).length
    };

    return {
        title: 'Sensor Report',
        period: `${from.toLocaleDateString()} to ${to.toLocaleDateString()}`,
        summary,
        sensors: sensors.map(sensor => ({
            ...sensor.toObject(),
            alarmCount: sensor.activeAlarms?.length || 0,
            calibrationStatus: sensor.calibration?.status || 'unknown'
        })),
        generatedAt: new Date()
    };
}

// Generate equipment report data
async function generateEquipmentReportData(report) {
    const { from, to } = report.dateRange;

    const equipment = await Equipment.find({ deletedAt: null })
        .populate('assignedTo', 'name email')
        .sort({ type: 1, name: 1 });

    const summary = {
        totalEquipment: equipment.length,
        equipmentTypes: [...new Set(equipment.map(e => e.type))],
        operational: equipment.filter(e => e.status === 'operational').length,
        maintenance: equipment.filter(e => e.status === 'maintenance').length,
        outOfService: equipment.filter(e => e.status === 'out-of-service').length
    };

    return {
        title: 'Equipment Report',
        period: `${from.toLocaleDateString()} to ${to.toLocaleDateString()}`,
        summary,
        equipment,
        generatedAt: new Date()
    };
}

// Generate PDF report
async function generatePDFReport(report, data) {
    return new Promise((resolve, reject) => {
        try {
            const reportsDir = path.join(process.cwd(), 'reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const filename = `${report.reportCode}.pdf`;
            const filePath = path.join(reportsDir, filename);

            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text(data.title, { align: 'center' });
            doc.fontSize(12).text(`Period: ${data.period}`, { align: 'center' });
            doc.text(`Generated: ${data.generatedAt.toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);

            // Summary section
            doc.fontSize(16).text('Summary', { underline: true });
            doc.moveDown();

            Object.entries(data.summary).forEach(([key, value]) => {
                doc.fontSize(12).text(`${formatKey(key)}: ${value}`);
            });

            doc.moveDown(2);

            // Add specific content based on report type
            if (data.records) {
                addMaintenanceRecordsTable(doc, data.records);
            } else if (data.incidents) {
                addIncidentsTable(doc, data.incidents);
            } else if (data.kpis) {
                addKPIsTable(doc, data.kpis);
            }

            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
}

// Generate Excel report
async function generateExcelReport(report, data) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `${report.reportCode}.xlsx`;
    const filePath = path.join(reportsDir, filename);

    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Report Title', data.title]);
    summarySheet.addRow(['Period', data.period]);
    summarySheet.addRow(['Generated', data.generatedAt.toLocaleString()]);
    summarySheet.addRow([]);

    // Add summary data
    Object.entries(data.summary).forEach(([key, value]) => {
        summarySheet.addRow([formatKey(key), value]);
    });

    // Data sheet
    if (data.records) {
        addMaintenanceExcelSheet(workbook, data.records);
    } else if (data.incidents) {
        addIncidentsExcelSheet(workbook, data.incidents);
    } else if (data.sensors) {
        addSensorsExcelSheet(workbook, data.sensors);
    } else if (data.equipment) {
        addEquipmentExcelSheet(workbook, data.equipment);
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

// Generate JSON report
async function generateJSONReport(report, data) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `${report.reportCode}.json`;
    const filePath = path.join(reportsDir, filename);

    const jsonData = {
        reportInfo: {
            reportCode: report.reportCode,
            title: report.title,
            type: report.type,
            dateRange: report.dateRange,
            generatedAt: data.generatedAt,
            generatedBy: report.createdBy
        },
        ...data
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    return filePath;
}

// Helper functions for PDF generation
function addMaintenanceRecordsTable(doc, records) {
    doc.fontSize(16).text('Maintenance Records', { underline: true });
    doc.moveDown();

    records.slice(0, 20).forEach(record => {
        doc.fontSize(10)
            .text(`Equipment: ${record.equipment?.name || 'N/A'}`)
            .text(`Type: ${record.type}`)
            .text(`Status: ${record.status}`)
            .text(`Scheduled: ${record.scheduledDate?.toLocaleDateString()}`)
            .text(`Engineer: ${record.engineerId?.name || 'N/A'}`)
            .moveDown();
    });
}

function addIncidentsTable(doc, incidents) {
    doc.fontSize(16).text('Incidents', { underline: true });
    doc.moveDown();

    incidents.slice(0, 20).forEach(incident => {
        doc.fontSize(10)
            .text(`Title: ${incident.title}`)
            .text(`Severity: ${incident.severity}`)
            .text(`Status: ${incident.status}`)
            .text(`Reported: ${incident.reportedAt?.toLocaleDateString()}`)
            .text(`Reporter: ${incident.reportedBy?.name || 'N/A'}`)
            .moveDown();
    });
}

function addKPIsTable(doc, kpis) {
    doc.fontSize(16).text('Key Performance Indicators', { underline: true });
    doc.moveDown();

    Object.entries(kpis).forEach(([key, kpi]) => {
        const status = kpi.value >= kpi.target ? '✓' : '✗';
        doc.fontSize(12)
            .text(`${formatKey(key)}: ${kpi.value.toFixed(1)}${kpi.unit} (Target: ${kpi.target}${kpi.unit}) ${status}`)
            .moveDown();
    });
}

// Helper functions for Excel generation
function addMaintenanceExcelSheet(workbook, records) {
    const sheet = workbook.addWorksheet('Maintenance Records');

    // Headers
    sheet.addRow([
        'Equipment', 'Type', 'Status', 'Scheduled Date',
        'Completed Date', 'Engineer', 'Hours', 'Cost'
    ]);

    // Data
    records.forEach(record => {
        sheet.addRow([
            record.equipment?.name || 'N/A',
            record.type,
            record.status,
            record.scheduledDate?.toLocaleDateString(),
            record.completedDate?.toLocaleDateString(),
            record.engineerId?.name || 'N/A',
            record.actualHours || 0,
            record.cost?.total || 0
        ]);
    });
}

function addSensorsExcelSheet(workbook, sensors) {
    const sheet = workbook.addWorksheet('Sensors');

    // Headers
    sheet.addRow([
        'Name', 'Type', 'Location', 'Status', 'Current Value',
        'Unit', 'Alarm Status', 'Calibration Status'
    ]);

    // Data
    sensors.forEach(sensor => {
        sheet.addRow([
            sensor.name,
            sensor.type,
            sensor.location,
            sensor.status,
            sensor.currentReading?.value || 'N/A',
            sensor.currentReading?.unit || 'N/A',
            sensor.alarmStatus || 'normal',
            sensor.calibrationStatus
        ]);
    });
}

function addEquipmentExcelSheet(workbook, equipment) {
    const sheet = workbook.addWorksheet('Equipment');

    // Headers
    sheet.addRow([
        'Name', 'Type', 'Status', 'Location', 'Manufacturer',
        'Model', 'Serial Number', 'Assigned To'
    ]);

    // Data
    equipment.forEach(eq => {
        sheet.addRow([
            eq.name,
            eq.type,
            eq.status,
            eq.location,
            eq.manufacturer,
            eq.model,
            eq.serial,
            eq.assignedTo?.name || 'N/A'
        ]);
    });
}

function addIncidentsExcelSheet(workbook, incidents) {
    const sheet = workbook.addWorksheet('Incidents');

    // Headers
    sheet.addRow([
        'Title', 'Severity', 'Status', 'Type', 'Location',
        'Reported Date', 'Reporter', 'Assigned To'
    ]);

    // Data
    incidents.forEach(incident => {
        sheet.addRow([
            incident.title,
            incident.severity,
            incident.status,
            incident.type,
            incident.location,
            incident.reportedAt?.toLocaleDateString(),
            incident.reportedBy?.name || 'N/A',
            incident.assignedTo?.name || 'N/A'
        ]);
    });
}

// Utility functions
function getDefaultKPIMetrics() {
    return {
        availability: { include: true, target: 95 },
        reliability: { include: true, target: 98 },
        efficiency: { include: true, target: 90 },
        mttr: { include: true, target: 4 },
        mtbf: { include: true, target: 720 },
        safetyIncidents: { include: true, target: 0 },
        environmentalCompliance: { include: true, target: 100 }
    };
}

function getEstimatedGenerationTime(type, format) {
    const baseTime = {
        'kpi': '30-60 seconds',
        'maintenance': '1-2 minutes',
        'incident': '1-2 minutes',
        'sensor': '2-3 minutes',
        'equipment': '1-2 minutes'
    };

    return baseTime[type] || '1-2 minutes';
}

function hasReportAccess(userId, report) {
    // Check if user is the creator
    if (report.createdBy.toString() === userId) return true;

    // Check if report is public
    if (report.visibility === 'public') return true;

    // Check if user has explicit access
    const hasExplicitAccess = report.accessPermissions?.some(
        permission => permission.user?.toString() === userId
    );

    return hasExplicitAccess;
}

function getContentType(format) {
    const types = {
        'pdf': 'application/pdf',
        'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'csv': 'text/csv',
        'json': 'application/json'
    };

    return types[format] || 'application/octet-stream';
}

function formatKey(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}
