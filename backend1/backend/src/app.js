import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fileUpload from "express-fileupload";
import { securityHeaders, rateLimiter } from "./middleware/security.middleware.js";
import { authenticate } from "./middleware/auth.middleware.js";
import { authorize } from "./middleware/rbac.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import searchRoutes from "./routes/search.routes.js";
import caseRoutes from "./routes/case.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import timelineRoutes from "./routes/timeline.routes.js";
import evidenceRoutes from "./routes/evidence.routes.js";
import assistantRoutes from "./routes/assistant.routes.js";
import reportRoutes from "./routes/report.routes.js";
import cameraRoutes from "./routes/camera.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middlewares
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(fileUpload({ useTempFiles: false, limits: { fileSize: 2 * 1024 * 1024 * 1024 } })); // 2 GB limit
app.use(rateLimiter);

// Serve crop image assets statically from ai-search (3)
app.use("/api/uploads/crops", express.static(path.join(__dirname, "..", "..", "..", "ai-search (3)", "ai-search", "data", "input", "crops")));

// Unprotected routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// Protected routes (require JWT)
app.use(authenticate);

// RBAC mappings
app.use("/api/dashboard", authorize(["ADMIN", "OFFICER", "ANALYST", "VIEWER"]), dashboardRoutes);
app.use("/api/search", authorize(["ADMIN", "OFFICER", "ANALYST", "VIEWER"]), searchRoutes);
app.use("/api/assistant", authorize(["ADMIN", "OFFICER", "ANALYST"]), assistantRoutes);
app.use("/api/cases", authorize(["ADMIN", "OFFICER", "ANALYST", "VIEWER"]), caseRoutes);
app.use("/api/evidence", authorize(["ADMIN", "OFFICER", "ANALYST", "VIEWER"]), evidenceRoutes);
app.use("/api/report", authorize(["ADMIN", "OFFICER", "ANALYST", "VIEWER"]), reportRoutes);
app.use("/api/timeline", authorize(["ADMIN", "OFFICER", "ANALYST", "VIEWER"]), timelineRoutes);
app.use("/api/audit", authorize(["ADMIN"]), auditRoutes);
app.use("/api/uploads", authorize(["ADMIN", "OFFICER"]), uploadRoutes);
app.use("/api/cameras", authorize(["ADMIN", "OFFICER", "ANALYST", "VIEWER"]), cameraRoutes);
app.use("/api/ingest", authorize(["ADMIN", "OFFICER"]), ingestRoutes);

// Global Error Handler
app.use(errorHandler);

export default app; // trigger restart