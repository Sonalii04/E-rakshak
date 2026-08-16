import caseService from "../services/case.service.js";

export const listCases = async (req, res, next) => {
    try {
        const cases = await caseService.getAllCases();
        res.json(cases);
    } catch (error) {
        next(error);
    }
};

export const getCase = async (req, res, next) => {
    try {
        const c = await caseService.getCase(req.params.id);
        res.json(c);
    } catch (error) {
        next(error);
    }
};

export const createNewCase = async (req, res, next) => {
    try {
        const officerName = req.user?.username || req.body.officer || "System";
        const created = await caseService.createCase(req.body, officerName);
        res.status(201).json(created);
    } catch (error) {
        next(error);
    }
};

export const editCase = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        const updated = await caseService.updateCase(req.params.id, req.body, officerName);
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const removeCase = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        await caseService.deleteCase(req.params.id, officerName);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const addCaseEvidence = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        const updated = await caseService.addEvidenceToCase(req.params.id, req.body, officerName);
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const deleteCaseEvidence = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        const updated = await caseService.removeEvidenceFromCase(req.params.id, req.params.trackId, officerName);
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const addCaseNote = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        const updated = await caseService.addNoteToCase(req.params.id, req.body, officerName);
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

export const deleteCaseNote = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        const updated = await caseService.removeNoteFromCase(req.params.id, Number(req.params.index), officerName);
        res.json(updated);
    } catch (error) {
        next(error);
    }
};