import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendRoot = path.resolve(__dirname, "../..");
const projectRoot = path.resolve(backendRoot, "../..");

export const paths = {
    workspaceRoot: projectRoot,
    backendRoot,
    aiSearchRoot: path.resolve(projectRoot, "ai-search (3)/ai-search"),
    pythonExecutable: path.resolve(projectRoot, ".venv/Scripts/python.exe"),
    dataDir: path.resolve(backendRoot, "src/data"),
    storageDir: path.resolve(backendRoot, "storage"),
};
