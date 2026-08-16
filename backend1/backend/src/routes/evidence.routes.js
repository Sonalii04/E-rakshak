import express from "express";

import {

    addEvidence,
    getEvidence,
    deleteEvidence,
    bookmark,
    getAlEvidence

} from "../controllers/evidence.controller.js";

const router = express.Router();

router.post("/", addEvidence);
router.get(
    "/",
    getAlEvidence
);
router.get("/:caseId", getEvidence);

router.delete("/:id", deleteEvidence);
router.post("/bookmark",bookmark);
export default router;