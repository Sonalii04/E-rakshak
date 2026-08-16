import express from "express";

import {

    listCases,
    getCase,
    createNewCase,
    editCase,
    removeCase,
    addCaseEvidence,
    deleteCaseEvidence,
    addCaseNote,
    deleteCaseNote

} from "../controllers/case.controller.js";

const router = express.Router();

router.get(
    "/",
    listCases
);

router.get(
    "/:id",
    getCase
);

router.post(
    "/",
    createNewCase
);

router.put(
    "/:id",
    editCase
);

router.delete(
    "/:id",
    removeCase
);

router.post(
    "/:id/evidence",
    addCaseEvidence
);

router.delete(
    "/:id/evidence/:trackId",
    deleteCaseEvidence
);

router.post(
    "/:id/notes",
    addCaseNote
);

router.delete(
    "/:id/notes/:index",
    deleteCaseNote
);

export default router;