export class AppError extends Error {
    constructor(message, statusCode, code = "INTERNAL_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation failed") {
        super(message, 400, "VALIDATION_ERROR");
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404, "NOT_FOUND");
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized access") {
        super(message, 401, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden access") {
        super(message, 403, "FORBIDDEN");
    }
}

export class AIServiceError extends AppError {
    constructor(message = "AI Search execution failed") {
        super(message, 500, "AI_SERVICE_ERROR");
    }
}

export class ReportGenerationError extends AppError {
    constructor(message = "Report generation failed") {
        super(message, 500, "REPORT_GENERATION_ERROR");
    }
}

export class PersistenceError extends AppError {
    constructor(message = "Database persistence failed") {
        super(message, 500, "PERSISTENCE_ERROR");
    }
}
