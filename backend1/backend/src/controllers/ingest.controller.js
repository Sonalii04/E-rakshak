import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as yaml from "js-yaml";
import crypto from "crypto";
import pool from "../database/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths configuration pointing to D:\projects\E-Rakshak and subfolders
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const AIVISION_DIR = path.join(PROJECT_ROOT, "AIVision");
const AI_SEARCH_DIR = path.join(PROJECT_ROOT, "ai-search (3)", "ai-search");
const PYTHON_EXE = path.join(PROJECT_ROOT, ".venv", "Scripts", "python.exe");
const UPLOADS_DIR = path.join(AIVISION_DIR, "uploads");

// Ensure uploads directory exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Helper: append log line to DB job ───────────────────────────────────────
async function appendLog(jobId, line) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${line}\n`;
  try {
    await pool.query(
      "UPDATE ingest_jobs SET log = COALESCE(log, '') || $1 WHERE id = $2",
      [entry, jobId]
    );
  } catch (err) {
    console.error("appendLog error:", err.message);
  }
}

// ─── Helper: update job status ───────────────────────────────────────────────
async function setStatus(jobId, status, error = null) {
  const completedAt = ["complete", "failed"].includes(status) ? new Date() : null;
  await pool.query(
    "UPDATE ingest_jobs SET status = $1, error = $2, completed_at = $3 WHERE id = $4",
    [status, error, completedAt, jobId]
  );
}

// ─── Helper: spawn a python process and stream logs to DB ───────────────────
function spawnPython(exe, args, cwd, envExtra, jobId) {
  return new Promise((resolve, reject) => {
    const proc = spawn(exe, args, {
      cwd,
      env: { ...process.env, ...envExtra },
    });

    proc.stdout.on("data", async (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const l of lines) await appendLog(jobId, l);
    });

    proc.stderr.on("data", async (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const l of lines) await appendLog(jobId, l);
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });

    proc.on("error", reject);
  });
}

// ─── Helper: merge new metadata rows into master metadata.csv ───────────────
async function mergeMetadata(jobId, newCsvPath) {
  const masterCsv = path.join(AI_SEARCH_DIR, "data", "input", "metadata.csv");

  if (!fs.existsSync(newCsvPath)) {
    await appendLog(jobId, "WARNING: No new metadata.csv found from AIVision output.");
    return [];
  }

  const newContent = fs.readFileSync(newCsvPath, "utf-8");
  const newLines = newContent.split("\n").filter(Boolean);
  if (newLines.length <= 1) {
    await appendLog(jobId, "WARNING: New metadata.csv is empty (header only).");
    return [];
  }

  const newRows = newLines.slice(1); // skip header

  if (fs.existsSync(masterCsv)) {
    // Append new rows to existing master CSV (no header duplication)
    fs.appendFileSync(masterCsv, "\n" + newRows.join("\n"));
  } else {
    // Write full file with header
    fs.writeFileSync(masterCsv, newContent);
  }

  await appendLog(jobId, `Merged ${newRows.length} new tracks into master metadata.csv`);
  return newRows;
}

// ─── Helper: merge new crops into master crops dir ───────────────────────────
async function mergeCrops(jobId, sourceDir) {
  const destDir = path.join(AI_SEARCH_DIR, "data", "input", "crops");
  fs.mkdirSync(destDir, { recursive: true });

  if (!fs.existsSync(sourceDir)) {
    await appendLog(jobId, "WARNING: No crops directory found in AIVision output.");
    return;
  }

  const files = fs.readdirSync(sourceDir);
  let copied = 0;
  for (const file of files) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
    copied++;
  }
  await appendLog(jobId, `Copied ${copied} crop images to ai-search crops directory`);
}

// ─── Helper: sync new CSV rows → PostgreSQL tracks table ─────────────────────
async function syncTracksToDb(jobId, newCsvRows) {
  let synced = 0;
  for (const line of newCsvRows) {
    if (!line.trim()) continue;

    const parts = [];
    let insideQuote = false;
    let current = "";
    for (const char of line) {
      if (char === '"') { insideQuote = !insideQuote; }
      else if (char === "," && !insideQuote) { parts.push(current); current = ""; }
      else { current += char; }
    }
    parts.push(current);

    if (parts.length < 8) continue;

    try {
      await pool.query(
        `INSERT INTO tracks (id, camera_id, class_name, first_seen_time, last_seen_time, num_observations, max_confidence, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          parts[0],
          parts[1],
          parts[2],
          parts[3] || null,
          parts[4] || null,
          parseInt(parts[5] || "0"),
          parseFloat(parts[6] || "0.0"),
          (parts[7] || "").replace(/"/g, ""),
        ]
      );
      synced++;
    } catch (err) {
      await appendLog(jobId, `WARN: Could not insert track ${parts[0]}: ${err.message}`);
    }
  }
  await appendLog(jobId, `Synced ${synced} new tracks into PostgreSQL tracks table`);
}

// ─── BACKGROUND PIPELINE ─────────────────────────────────────────────────────
async function runPipeline(jobId, videoPath, cameraId, cameraLocation, fps) {
  const runDir = path.join(AIVISION_DIR, "output", jobId);
  const cropsDir = path.join(runDir, "crops");
  const metadataDir = path.join(runDir, "metadata");
  const newMetaCsv = path.join(metadataDir, "metadata.csv");

  try {
    // Step 1: Write per-job camera_info.json
    await setStatus(jobId, "running");
    await appendLog(jobId, `=== Step 1/4: Setting up pipeline for job ${jobId} ===`);

    const cameraInfoPath = path.join(AIVISION_DIR, `configs`, `camera_${jobId}.json`);
    fs.writeFileSync(cameraInfoPath, JSON.stringify({
      camera_id: cameraId,
      location: cameraLocation,
      resolution: [1920, 1080],
      fps: parseInt(fps) || 20,
    }, null, 2));

    // Step 2: Write per-job config.yaml
    const baseConfigPath = path.join(AIVISION_DIR, "configs", "config.yaml");
    const baseConfig = yaml.load(fs.readFileSync(baseConfigPath, "utf-8"));
    const jobConfig = {
      ...baseConfig,
      video: {
        ...baseConfig.video,
        input_path: videoPath,
        camera_info_path: cameraInfoPath,
      },
      output: {
        ...baseConfig.output,
        crops_dir: cropsDir,
        annotated_video_dir: path.join(runDir, "annotated_video"),
        metadata_dir: metadataDir,
      },
      logging: {
        ...baseConfig.logging,
        log_file: path.join(runDir, "pipeline.log"),
      },
      models: {
        ...baseConfig.models,
        use_vlm_caption: false, // Disabled for speed — enables fast ingestion
      }
    };

    const jobConfigPath = path.join(AIVISION_DIR, "configs", `job_${jobId}.yaml`);
    fs.writeFileSync(jobConfigPath, yaml.dump(jobConfig));
    await appendLog(jobId, `Config written to ${jobConfigPath}`);

    // Step 3: Run AIVision detection + tracking pipeline
    await appendLog(jobId, `=== Step 2/4: Running YOLO detection & tracking (this may take several minutes) ===`);
    await spawnPython(
      PYTHON_EXE,
      ["main.py", "--config", jobConfigPath],
      AIVISION_DIR,
      { OPENBLAS_NUM_THREADS: "1", MKL_NUM_THREADS: "1", OMP_NUM_THREADS: "1" },
      jobId
    );
    await appendLog(jobId, "AIVision pipeline complete.");

    // Step 4: Merge crops and metadata
    await appendLog(jobId, `=== Step 3/4: Merging crops and metadata into ai-search ===`);
    await mergeCrops(jobId, cropsDir);
    const newRows = await mergeMetadata(jobId, newMetaCsv);

    // Step 5: Re-generate CLIP embeddings
    await setStatus(jobId, "embedding");
    await appendLog(jobId, `=== Step 4/4: Regenerating CLIP embeddings (ai-search embed) ===`);
    await spawnPython(
      PYTHON_EXE,
      ["src/main.py", "embed"],
      AI_SEARCH_DIR,
      {
        OPENBLAS_NUM_THREADS: "1",
        MKL_NUM_THREADS: "1",
        OMP_NUM_THREADS: "1",
        HF_HUB_OFFLINE: "1",
        TRANSFORMERS_OFFLINE: "1",
      },
      jobId
    );
    await appendLog(jobId, "Embedding regeneration complete.");

    // Step 6: Sync new tracks to PostgreSQL
    await setStatus(jobId, "merging");
    await appendLog(jobId, `=== Syncing ${newRows.length} new tracks to PostgreSQL ===`);
    await syncTracksToDb(jobId, newRows);

    // Cleanup temp config files
    try { fs.unlinkSync(jobConfigPath); } catch (_) {}
    try { fs.unlinkSync(cameraInfoPath); } catch (_) {}
    try { fs.unlinkSync(videoPath); } catch (_) {}

    await setStatus(jobId, "complete");
    await appendLog(jobId, "=== Ingestion complete. Video is now searchable. ===");

  } catch (err) {
    console.error(`Ingestion job ${jobId} failed:`, err.message);
    await appendLog(jobId, `ERROR: ${err.message}`);
    await setStatus(jobId, "failed", err.message);
  }
}

// ─── CONTROLLER EXPORTS ──────────────────────────────────────────────────────

export const uploadVideo = async (req, res, next) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: "No video file uploaded. Use field name 'video'." });
    }

    const { cameraId, cameraLocation, fps } = req.body;
    if (!cameraId) {
      return res.status(400).json({ error: "cameraId is required." });
    }

    const videoFile = req.files.video;
    const jobId = `JOB-${Date.now()}`;
    const ext = path.extname(videoFile.name) || ".mp4";
    const savedPath = path.join(UPLOADS_DIR, `${jobId}${ext}`);

    // Save uploaded video to disk
    await videoFile.mv(savedPath);

    // Compute SHA-256 hash of video to detect duplicates
    const fileBuffer = fs.readFileSync(savedPath);
    const videoHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Check if this video has already been processed or is in progress
    const existingJob = await pool.query(
      `SELECT * FROM ingest_jobs 
       WHERE video_hash = $1 AND status IN ('complete', 'queued', 'running', 'embedding', 'merging') 
       ORDER BY created_at DESC LIMIT 1`,
      [videoHash]
    );

    if (existingJob.rowCount > 0) {
      const prevJob = existingJob.rows[0];
      // Clean up uploaded temp file since we won't process it again
      try { fs.unlinkSync(savedPath); } catch (_) {}

      const isFinished = prevJob.status === "complete";
      return res.status(200).json({
        alreadyProcessed: true,
        jobId: prevJob.id,
        status: prevJob.status,
        message: isFinished
          ? `This video (${videoFile.name}) has ALREADY been processed in Job ${prevJob.id}. All detections & embeddings are already saved in the database.`
          : `This video (${videoFile.name}) is ALREADY being processed in Job ${prevJob.id} (Status: ${prevJob.status}).`,
        statusUrl: `/api/ingest/status/${prevJob.id}`,
      });
    }

    // Create DB job record
    await pool.query(
      `INSERT INTO ingest_jobs (id, camera_id, camera_location, video_name, video_hash, status)
       VALUES ($1, $2, $3, $4, $5, 'queued')`,
      [jobId, cameraId, cameraLocation || "", videoFile.name, videoHash]
    );

    // Fire-and-forget pipeline (background)
    runPipeline(jobId, savedPath, cameraId, cameraLocation || cameraId, fps).catch(console.error);

    res.status(201).json({
      jobId,
      message: "Video uploaded. Ingestion pipeline started in background.",
      statusUrl: `/api/ingest/status/${jobId}`,
    });
  } catch (err) {
    next(err);
  }
};

export const getJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const result = await pool.query("SELECT * FROM ingest_jobs WHERE id = $1", [jobId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = result.rows[0];
    // Return last 50 log lines for the UI
    const logLines = (job.log || "").split("\n").filter(Boolean);
    const recentLog = logLines.slice(-50).join("\n");

    res.json({
      id: job.id,
      cameraId: job.camera_id,
      cameraLocation: job.camera_location,
      videoName: job.video_name,
      status: job.status,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      error: job.error,
      log: recentLog,
      progress: statusToProgress(job.status),
    });
  } catch (err) {
    next(err);
  }
};

export const listJobs = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, camera_id, camera_location, video_name, status, created_at, completed_at, error FROM ingest_jobs ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows.map(job => ({
      id: job.id,
      cameraId: job.camera_id,
      cameraLocation: job.camera_location,
      videoName: job.video_name,
      status: job.status,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      error: job.error,
      progress: statusToProgress(job.status),
    })));
  } catch (err) {
    next(err);
  }
};

function statusToProgress(status) {
  const map = {
    queued: 5,
    running: 35,
    embedding: 70,
    merging: 90,
    complete: 100,
    failed: 0,
  };
  return map[status] ?? 0;
}
