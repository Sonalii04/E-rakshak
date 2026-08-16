import express from "express";
import { health } from "../controllers/health.controller.js";

const router = express.Router();

router.get("/", health);

export default router;