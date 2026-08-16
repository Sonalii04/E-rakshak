import authService from "../services/auth.service.js";
import auditRepository from "../repositories/audit.repository.js";

export const register = async (req, res, next) => {
    try {
        const { username, password, role } = req.body;
        const user = await authService.register(username, password, role);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const data = await authService.login(username, password);

        // Audit entry
        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: username,
            action: "LOGIN",
            ip: req.ip || "",
            details: { userId: data.user.id }
        });

        res.json(data);
    } catch (error) {
        next(error);
    }
};