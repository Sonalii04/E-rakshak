import fs from "fs/promises";

export async function readJSON(path) {

    try {

        const data = await fs.readFile(path, "utf8");

        return JSON.parse(data);

    }

    catch {

        return [];

    }

}

export async function writeJSON(path, data) {

    await fs.writeFile(

        path,

        JSON.stringify(data, null, 4)

    );

}