import fs from "fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { PersistenceError } from "../errors/appError.js";

export class BaseRepository {
    constructor(filePath) {
        this.filePath = path.resolve(filePath);
        this.ensureFile();
    }

    ensureFile() {
        if (!existsSync(this.filePath)) {
            mkdirSync(path.dirname(this.filePath), { recursive: true });
            writeFileSync(this.filePath, "[]", "utf-8");
        }
    }

    async read() {
        try {
            const data = await fs.readFile(this.filePath, "utf-8");
            return JSON.parse(data.trim() || "[]");
        } catch (error) {
            console.error(`[BaseRepository] Read failed on ${this.filePath}:`, error);
            return [];
        }
    }

    async write(data) {
        const tempPath = `${this.filePath}.tmp`;
        try {
            await fs.mkdir(path.dirname(this.filePath), { recursive: true });
            await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
            await fs.rename(tempPath, this.filePath);
            return true;
        } catch (error) {
            console.error(`[BaseRepository] Atomic write failed on ${this.filePath}:`, error);
            try {
                await fs.unlink(tempPath);
            } catch (_) {}
            throw new PersistenceError(`Failed to save data atomically to database.`);
        }
    }
}
