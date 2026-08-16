import express from "express";
import { generateReport, downloadPdfReport, getReports, createReport } from "../controllers/report.controller.js";

const router = express.Router();

router.get("/", getReports);
router.post("/", createReport);
router.get("/:caseId", generateReport);
router.get("/:caseId/pdf", downloadPdfReport);

export default router;