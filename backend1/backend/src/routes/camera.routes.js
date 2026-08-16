import express from "express";
import { getCameras, updateCameraStatus } from "../controllers/camera.controller.js";

const router = express.Router();

router.get("/", getCameras);
router.put("/:id", updateCameraStatus);

export default router;
