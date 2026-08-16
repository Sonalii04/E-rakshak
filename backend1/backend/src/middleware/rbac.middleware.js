import { ForbiddenError } from "../errors/appError.js";

export function authorize(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return next(new ForbiddenError("Access forbidden: User details missing."));
        }

        const role = req.user.role.toUpperCase();
        if (role === "ADMIN") {
            return next(); // ADMIN has master access
        }

        if (allowedRoles.includes(role)) {
            return next();
        }

        next(new ForbiddenError("Access forbidden: Insufficient privileges."));
    };
}
