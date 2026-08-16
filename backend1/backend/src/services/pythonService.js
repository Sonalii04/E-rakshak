import { spawn } from "child_process";
import path from "path";

const PYTHON = "python";

const SEARCH_PROJECT = path.resolve("../ai-search");

export function runSearch(query) {
    return new Promise((resolve, reject) => {

        const process = spawn(
            PYTHON,
            [
                "src/main.py",
                "search",
                query,
                "--json",
            ],
            {
                cwd: SEARCH_PROJECT,
            }
        );

        let stdout = "";
        let stderr = "";

        process.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        process.on("close", (code) => {

            if (code !== 0) {
                reject(new Error(stderr));
                return;
            }

            try {

                const json = JSON.parse(stdout);

                resolve(json);

            } catch (err) {

                reject(
                    new Error(
                        "Failed to parse JSON from Python.\n\n" +
                        stdout
                    )
                );

            }

        });

    });
}