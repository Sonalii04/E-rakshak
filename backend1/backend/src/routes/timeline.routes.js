import express from "express";

import {
    addTimelineEvent,
    getTimeline,
    getTrackTimeline
} from "../controllers/timeline.controller.js";

const router = express.Router();

router.post("/", addTimelineEvent);

router.get("/:caseId", getTimeline);
router.get("/track/:trackId", getTrackTimeline);

export default router;