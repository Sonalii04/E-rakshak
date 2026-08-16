import express from "express";

import {
    getUploads,
    createUpload,
} from "../controllers/upload.controller.js";

const router = express.Router();

router.get("/", getUploads);

router.post("/", createUpload);

export default router;