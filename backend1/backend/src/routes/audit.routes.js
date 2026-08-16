import express from "express";
import {
    getAuditLogs,
    createAuditLog,
    getCaseLogs
} from "../controllers/audit.controller.js";

const router = express.Router();

router.get("/", getAuditLogs);
router.post("/", createAuditLog);
router.get("/case/:caseId", getCaseLogs);

export default router;