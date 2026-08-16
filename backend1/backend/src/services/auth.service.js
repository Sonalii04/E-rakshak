import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userRepository from "../repositories/user.repository.js";
import { env } from "../config/env.js";
import { UnauthorizedError, ValidationError } from "../errors/appError.js";

class AuthService {
    async register(username, password, role = "OFFICER") {
        if (!username || !password) {
            throw new ValidationError("Username and password are required.");
        }
        
        const existing = await userRepository.findByUsername(username);
        if (existing) {
            throw new ValidationError("Username already exists.");
        }

        const validRoles = ["ADMIN", "OFFICER", "ANALYST", "VIEWER"];
        const normalizedRole = role.toUpperCase();
        if (!validRoles.includes(normalizedRole)) {
            throw new ValidationError(`Invalid role. Valid roles are: ${validRoles.join(", ")}`);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: `USER-${Date.now()}`,
            username: username.trim(),
            password: hashedPassword,
            role: normalizedRole,
            createdAt: new Date().toISOString()
        };

        const saved = await userRepository.save(newUser);
        return {
            id: saved.id,
            username: saved.username,
            role: saved.role
        };
    }

    async login(username, password) {
        if (!username || !password) {
            throw new ValidationError("Username and password are required.");
        }

        const user = await userRepository.findByUsername(username);
        if (!user) {
            throw new UnauthorizedError("Invalid username or password.");
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedError("Invalid username or password.");
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
    }
}

export default new AuthService();
