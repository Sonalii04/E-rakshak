import evidenceService from "../services/evidence.service.js";

export const addEvidence = async (req, res, next) => {
    try {
        const officerName = req.user?.username || req.body.officer || "System";
        const item = await evidenceService.bookmarkEvidence(req.body, officerName);
        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
};

export const getEvidence = async (req, res, next) => {
    try {
        const items = await evidenceService.getEvidenceForCase(req.params.caseId);
        res.json(items);
    } catch (error) {
        next(error);
    }
};

export const deleteEvidence = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        await evidenceService.removeEvidence(req.params.id, officerName);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const bookmark = async (req, res, next) => {
    try {
        const officerName = req.user?.username || req.body.officer || "System";
        const item = await evidenceService.bookmarkEvidence(req.body, officerName);
        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
};

export const getAlEvidence = async (req, res, next) => {
    try {
        const items = await evidenceService.getEvidence();
        res.json(items);
    } catch (error) {
        next(error);
    }
};