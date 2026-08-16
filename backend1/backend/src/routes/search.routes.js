import express from "express";
import {
    search,
    getTrack,
    getVehicle,
    similarSearch,
    getSuggestions,
    getSaved,
    postSaved,
    deleteSaved,
    getHistory,
    postHistory,
    deleteHistory
} from "../controllers/search.controller.js";

const router = express.Router();

router.post("/", search);
router.get("/track/:trackId", getTrack);
router.get("/vehicle/:vehicleNumber", getVehicle);
router.post("/similar", similarSearch);

router.get("/suggestions", getSuggestions);

router.get("/saved", getSaved);
router.post("/saved", postSaved);
router.delete("/saved/:id", deleteSaved);

router.get("/history", getHistory);
router.post("/history", postHistory);
router.delete("/history/:id", deleteHistory);

export default router;