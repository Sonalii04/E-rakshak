import auditRepository from "../repositories/audit.repository.js";

export const getAuditLogs = async (req, res, next) => {
    try {
        const logs = await auditRepository.findAll();
        res.json(logs);
    } catch (error) {
        next(error);
    }
};

export const createAuditLog = async (req, res, next) => {
    try {
        const log = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: req.body.officer || req.user?.username || "System",
            action: req.body.action,
            query: req.body.query || "",
            caseId: req.body.caseId || "",
            ip: req.ip || "",
            details: req.body.details || {}
        };
        const saved = await auditRepository.save(log);
        res.status(201).json(saved);
    } catch (error) {
        next(error);
    }
};

export const getCaseLogs = async (req, res, next) => {
    try {
        const logs = await auditRepository.findByCaseId(req.params.caseId);
        res.json(logs);
    } catch (error) {
        next(error);
    }
};