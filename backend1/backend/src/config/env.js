import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from backend directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET || "e-rakshak-super-secret-key-123",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 10000,
    REQUEST_TIMEOUT: Number(process.env.REQUEST_TIMEOUT) || 15000,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
