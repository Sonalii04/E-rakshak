import express from "express";

import {

    investigate

} from "../controllers/assistant.controller.js";

const router = express.Router();

router.post(

    "/investigate",

    investigate

);

export default router;