import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// Rate limiting setup
export const rateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: {
        error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later."
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const securityHeaders = helmet();
