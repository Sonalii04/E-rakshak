import { env } from "../config/env.js";

export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || "INTERNAL_ERROR";
    const message = err.message || "An unexpected error occurred.";

    // Log the error internally
    console.error(`[Error] Code: ${code}, Message: ${message}, Path: ${req.path}`);
    if (statusCode === 500) {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        error: {
            code,
            message,
            ...(env.NODE_ENV === "development" && { stack: err.stack }),
        }
    });
}
