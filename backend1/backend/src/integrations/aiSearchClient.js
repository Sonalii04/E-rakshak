import { spawn } from "child_process";
import { paths } from "../config/paths.js";
import { AIServiceError } from "../errors/appError.js";

class AISearchClient {
    async execute(query, topK = null, filters = null) {
        return new Promise((resolve, reject) => {
            const args = [
                "src/main.py",
                "search",
                query || "",
                "--json"
            ];

            if (topK !== null && topK !== undefined) {
                args.push("--top-k", String(topK));
            }

            // Strip empty/null filter values before sending to Python
            if (filters && typeof filters === "object") {
                const cleanFilters = Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => {
                        if (v === null || v === undefined) return false;
                        if (typeof v === "string" && v.trim() === "") return false;
                        if (typeof v === "number" && (isNaN(v) || v <= 0)) return false;
                        return true;
                    })
                );
                if (Object.keys(cleanFilters).length > 0) {
                    args.push("--filters-json", JSON.stringify(cleanFilters));
                }
            }

            console.log(`[AISearchClient] Spawning: ${paths.pythonExecutable}`, args.join(" "));

            const pyProcess = spawn(paths.pythonExecutable, args, {
                cwd: paths.aiSearchRoot,
                env: {
                    ...process.env,
                    PYTHONPATH: "src",
                    OPENBLAS_NUM_THREADS: "1",
                    MKL_NUM_THREADS: "1",
                    OMP_NUM_THREADS: "1",
                }
            });

            let stdout = "";
            let stderr = "";

            // Enforce a process timeout of 180 seconds (3 minutes) to allow slow CPU loads
            const timeout = setTimeout(() => {
                console.error(`[AISearchClient] Process timed out after 180 seconds. Killing...`);
                pyProcess.kill("SIGKILL");
                reject(new AIServiceError("AI Search request timed out. Please try again."));
            }, 180000);

            pyProcess.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            pyProcess.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            pyProcess.on("close", (code) => {
                clearTimeout(timeout);

                if (code !== 0) {
                    console.error(`[AISearchClient] Process closed with code ${code}. Stderr: ${stderr.slice(0, 500)}`);
                    reject(new AIServiceError(`AI Search engine failed with code ${code}. Check Python environment.`));
                    return;
                }

                try {
                    // Find the JSON object in stdout (skip any INFO log lines)
                    const jsonStart = stdout.indexOf("{");
                    if (jsonStart === -1) {
                        throw new Error("No JSON found in Python output");
                    }
                    const response = JSON.parse(stdout.slice(jsonStart));
                    resolve(response);
                } catch (err) {
                    console.error(`[AISearchClient] Failed to parse JSON:`, err, `Raw output:`, stdout.slice(0, 500));
                    reject(new AIServiceError("Failed to parse response payload from AI Search."));
                }
            });

            pyProcess.on("error", (err) => {
                clearTimeout(timeout);
                console.error(`[AISearchClient] Spawn error:`, err);
                reject(new AIServiceError(`Failed to start AI Search process: ${err.message}`));
            });
        });
    }
}

export default new AISearchClient();
