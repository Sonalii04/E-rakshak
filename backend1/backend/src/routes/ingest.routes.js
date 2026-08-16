import express from "express";
import { uploadVideo, getJobStatus, listJobs } from "../controllers/ingest.controller.js";

const router = express.Router();

// POST /api/ingest/upload — Upload a new video for ingestion
router.post("/upload", uploadVideo);

// GET /api/ingest/jobs — List all ingestion jobs
router.get("/jobs", listJobs);

// GET /api/ingest/status/:jobId — Get status + log of a specific job
router.get("/status/:jobId", getJobStatus);

export default router;
