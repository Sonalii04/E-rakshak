import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { paths } from "../config/paths.js";
import pool from "../database/db.js";
import timelineService from "../services/timeline.service.js";

export const addTimelineEvent = async (req, res, next) => {
    try {
        const event = await timelineService.addEvent(req.body);
        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};

export const getTimeline = async (req, res, next) => {
    try {
        const events = await timelineService.getTimelineForCase(req.params.caseId);
        res.json(events);
    } catch (error) {
        next(error);
    }
};

// Helper: build human-readable camera label from camera_id
function cameraLabel(cameraId) {
    if (!cameraId) return "Unknown Camera";
    return cameraId
        .split("_")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export const getTrackTimeline = async (req, res, next) => {
  const { trackId } = req.params;

  if (!trackId) {
    return res.status(400).json({ error: "trackId is required" });
  }

  try {
    const cropsDir = path.join(paths.aiSearchRoot, "data", "input", "crops");
    let cropFiles = [];
    try {
      if (fs.existsSync(cropsDir)) {
        cropFiles = fs.readdirSync(cropsDir);
      }
    } catch (err) {
      console.error("Failed to read crops directory:", err);
    }

    function getPreview(tid) {
      const match = cropFiles.find(f => f.startsWith(tid + "_"));
      return match ? `/api/uploads/crops/${match}` : "";
    }

    // --- Step 1: Use Python 'similar' mode to find related tracks ---
    const trail = await new Promise((resolve) => {
      const pythonScript = path.join(paths.aiSearchRoot, "src", "main.py");
      const python = spawn(paths.pythonExecutable, [pythonScript, "similar", trackId, "--json"], {
        cwd: paths.aiSearchRoot,
        env: {
          ...process.env,
          OPENBLAS_NUM_THREADS: "1",
          MKL_NUM_THREADS: "1",
          OMP_NUM_THREADS: "1",
        }
      });

      let output = "";
      let error = "";

      python.stdout.on("data", (data) => { output += data.toString(); });
      python.stderr.on("data", (data) => { error += data.toString(); });

      python.on("close", async (code) => {
        const trailItems = [];

        if (code === 0) {
          try {
            const start = output.indexOf("[");
            if (start !== -1) {
              const parsed = JSON.parse(output.substring(start));
              for (const r of parsed) {
                trailItems.push({
                  id: r.track_id || r.id,
                  camera: cameraLabel(r.camera_id),
                  cameraId: r.camera_id,
                  timestamp: r.first_seen_time || r.timestamp,
                  confidence: Math.round((r.final_score || r.clip_score || r.similarity_score || 0.75) * 100),
                  preview: getPreview(r.track_id || r.id),
                  location: cameraLabel(r.camera_id)
                });
              }
            }
          } catch (e) {
            console.error("Failed to parse Python similar output:", e);
          }
        } else {
          console.error(`Python 'similar' failed (code ${code}): ${error}`);
        }

        // --- Step 2: Always prepend the original query track from DB ---
        try {
          const trackRes = await pool.query("SELECT * FROM tracks WHERE id = $1", [trackId]);
          if (trackRes.rowCount > 0) {
            const track = trackRes.rows[0];
            trailItems.unshift({
              id: trackId,
              camera: cameraLabel(track.camera_id),
              cameraId: track.camera_id,
              timestamp: track.first_seen_time,
              confidence: 100,
              preview: getPreview(trackId),
              location: cameraLabel(track.camera_id)
            });
          }
        } catch (dbErr) {
          console.error("DB lookup for track failed:", dbErr.message);
        }

        // Deduplicate by track id and sort by timestamp
        const seen = new Set();
        const unique = trailItems.filter(t => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
        unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        resolve(unique);
      });

      python.on("error", async (err) => {
        console.error("Spawn error for similar:", err);
        // Fallback: just return the query track from DB
        const fallback = [];
        try {
          const trackRes = await pool.query("SELECT * FROM tracks WHERE id = $1", [trackId]);
          if (trackRes.rowCount > 0) {
            const track = trackRes.rows[0];
            fallback.push({
              id: trackId,
              camera: cameraLabel(track.camera_id),
              cameraId: track.camera_id,
              timestamp: track.first_seen_time,
              confidence: 100,
              preview: getPreview(trackId),
              location: cameraLabel(track.camera_id)
            });
          }
        } catch (e) {}
        resolve(fallback);
      });
    });

    res.json(trail);
  } catch (err) {
    next(err);
  }
};