import { spawn } from "child_process";
import { paths } from "../config/paths.js";

export const health = async (req, res) => {
    let aiSearchOk = false;

    // Check if python environment works
    const checkPython = () => {
        return new Promise((resolve) => {
            const process = spawn(paths.pythonExecutable, ["-c", "print('ok')"], {
                timeout: 3000
            });
            
            let output = "";
            process.stdout.on("data", (data) => {
                output += data.toString();
            });

            process.on("close", (code) => {
                resolve(code === 0 && output.trim() === "ok");
            });
            
            process.on("error", () => {
                resolve(false);
            });
        });
    };

    aiSearchOk = await checkPython();

    res.json({
        status: aiSearchOk ? "ok" : "degraded",
        backend: true,
        aiSearch: aiSearchOk,
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
};