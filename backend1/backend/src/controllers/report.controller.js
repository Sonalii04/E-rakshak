import reportService from "../services/report.service.js";
import pdfService from "../services/pdf.service.js";
import auditRepository from "../repositories/audit.repository.js";
import reportRepository from "../repositories/report.repository.js";

export const getReports = async (req, res, next) => {
    try {
        const reports = await reportRepository.findAll();
        res.json(reports);
    } catch (err) {
        next(err);
    }
};

export const createReport = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        const payload = {
            ...req.body,
            generatedBy: req.body.generatedBy || officerName
        };
        const saved = await reportRepository.save(payload);
        res.status(201).json(saved);
    } catch (err) {
        next(err);
    }
};

export const generateReport = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const officerName = req.user?.username || "System";
        const report = await reportService.generateReport(caseId);

        // Audit log
        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "GENERATE_REPORT",
            caseId,
            details: { reportId: report.reportId }
        });

        res.json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};

export const downloadPdfReport = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const officerName = req.user?.username || "System";
        const report = await reportService.generateReport(caseId);

        // Audit log
        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "EXPORT_REPORT",
            caseId,
            details: { reportId: report.reportId, format: "PDF" }
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=report-${caseId}.pdf`);

        await pdfService.generatePdf(report, res);
    } catch (err) {
        next(err);
    }
};