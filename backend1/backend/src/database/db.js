import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env variables are loaded from backend1/backend/.env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new pg.Pool({ connectionString })
  : new pg.Pool({
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
      host: process.env.PGHOST || "localhost",
      port: parseInt(process.env.PGPORT || "5432"),
      database: process.env.PGDATABASE || "erakshak",
    });

export default pool;

export async function initDb() {
  let client;
  try {
    console.log("Connecting to PostgreSQL database...");
    client = await pool.connect();
    console.log("Initializing PostgreSQL database...");
    
    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS cameras (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        last_active TIMESTAMP,
        resolution VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS cases (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        officer VARCHAR(100) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        tags JSONB,
        evidence JSONB,
        timeline JSONB,
        notes JSONB
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        officer VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        query TEXT,
        case_id VARCHAR(50),
        ip VARCHAR(50),
        details JSONB
      );

      CREATE TABLE IF NOT EXISTS evidence (
        id VARCHAR(50) PRIMARY KEY,
        case_id VARCHAR(50) REFERENCES cases(id) ON DELETE CASCADE,
        track_id VARCHAR(50) NOT NULL,
        camera_id VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP,
        class_name VARCHAR(100),
        description TEXT,
        similarity DOUBLE PRECISION,
        thumbnail VARCHAR(255),
        metadata JSONB
      );

      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        format VARCHAR(50) NOT NULL,
        date TIMESTAMP,
        user_name VARCHAR(100) NOT NULL,
        hash VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS timeline_events (
        id VARCHAR(50) PRIMARY KEY,
        case_id VARCHAR(50) REFERENCES cases(id) ON DELETE CASCADE,
        track_id VARCHAR(50) NOT NULL,
        camera_id VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        timestamp TIMESTAMP,
        description TEXT,
        metadata JSONB
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id VARCHAR(50) PRIMARY KEY,
        camera_id VARCHAR(50) NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        first_seen_time TIMESTAMP WITH TIME ZONE NOT NULL,
        last_seen_time TIMESTAMP WITH TIME ZONE NOT NULL,
        num_observations INTEGER,
        max_confidence DOUBLE PRECISION,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS ingest_jobs (
        id VARCHAR(50) PRIMARY KEY,
        camera_id VARCHAR(100),
        camera_location VARCHAR(255),
        video_name VARCHAR(255),
        video_hash VARCHAR(64),
        status VARCHAR(50) DEFAULT 'queued',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        log TEXT DEFAULT '',
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id VARCHAR(50) PRIMARY KEY,
        query TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        officer VARCHAR(100) NOT NULL,
        result_count INTEGER DEFAULT 0,
        filters JSONB,
        duration DOUBLE PRECISION DEFAULT 0.0
      );

      CREATE TABLE IF NOT EXISTS saved_searches (
        id VARCHAR(50) PRIMARY KEY,
        query TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        officer VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        filters JSONB
      );
    `);
    
    // Migrate: add video_hash column if it doesn't exist (safe for existing installs)
    await client.query(`
      ALTER TABLE ingest_jobs ADD COLUMN IF NOT EXISTS video_hash VARCHAR(64);
    `);

    // Migrate: add extra report columns if they don't exist
    await client.query(`
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS query VARCHAR(255);
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS cameras JSONB;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS range_start TIMESTAMP;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS range_end TIMESTAMP;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS matches INTEGER;
    `);

    // Reset stuck/interrupted ingestion jobs from previous crashes or restarts
    console.log("Resetting any interrupted ingestion jobs to 'failed'...");
    await client.query(`
      UPDATE ingest_jobs 
      SET status = 'failed', error = 'Ingestion process was interrupted due to server restart.' 
      WHERE status IN ('queued', 'running', 'embedding', 'merging')
    `);

    // Seed Data paths
    const dataDir = path.join(__dirname, "..", "data");
    
    // Seed Cameras
    const camerasCount = await client.query("SELECT COUNT(*) FROM cameras");
    if (parseInt(camerasCount.rows[0].count) === 0) {
      console.log("Seeding cameras...");
      const filePath = path.join(dataDir, "cameras.json");
      if (fs.existsSync(filePath)) {
        const cameras = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        for (const cam of cameras) {
          await client.query(
            "INSERT INTO cameras (id, name, location, status, last_active, resolution) VALUES ($1, $2, $3, $4, $5, $6)",
            [cam.id, cam.name, cam.location, cam.status, cam.lastActive || null, cam.resolution || null]
          );
        }
      }
    }
    
    // Seed Cases
    const casesCount = await client.query("SELECT COUNT(*) FROM cases");
    if (parseInt(casesCount.rows[0].count) === 0) {
      console.log("Seeding cases...");
      const filePath = path.join(dataDir, "cases.json");
      if (fs.existsSync(filePath)) {
        const cases = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        for (const c of cases) {
          await client.query(
            "INSERT INTO cases (id, title, description, officer, priority, status, created_at, updated_at, tags, evidence, timeline, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
            [
              c.id, c.title, c.description || "", c.officer, c.priority, c.status,
              c.createdAt || new Date(), c.updatedAt || new Date(),
              JSON.stringify(c.tags || []), JSON.stringify(c.evidence || []),
              JSON.stringify(c.timeline || []), JSON.stringify(c.notes || [])
            ]
          );
        }
      }
    }

    // Seed Evidence
    const evidenceCount = await client.query("SELECT COUNT(*) FROM evidence");
    if (parseInt(evidenceCount.rows[0].count) === 0) {
      console.log("Seeding evidence...");
      const filePath = path.join(dataDir, "evidence.json");
      if (fs.existsSync(filePath)) {
        const evidence = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        for (const ev of evidence) {
          await client.query(
            "INSERT INTO evidence (id, case_id, track_id, camera_id, timestamp, class_name, description, similarity, thumbnail, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            [
              ev.id, ev.caseId, ev.trackId, ev.cameraId, ev.timestamp || null,
              ev.className || null, ev.description || null, ev.similarity || null,
              ev.thumbnail || "", JSON.stringify(ev.metadata || {})
            ]
          );
        }
      }
    }

    // Seed Timeline Events
    const timelineCount = await client.query("SELECT COUNT(*) FROM timeline_events");
    if (parseInt(timelineCount.rows[0].count) === 0) {
      console.log("Seeding timeline events...");
      const filePath = path.join(dataDir, "timeline.json");
      if (fs.existsSync(filePath)) {
        const events = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        for (const ev of events) {
          await client.query(
            "INSERT INTO timeline_events (id, case_id, track_id, camera_id, location, timestamp, description, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [
              ev.id, ev.caseId, ev.trackId, ev.cameraId, ev.location || "",
              ev.timestamp || null, ev.description || "", JSON.stringify(ev.metadata || {})
            ]
          );
        }
      }
    }

    // Seed Audit Logs
    const auditCount = await client.query("SELECT COUNT(*) FROM audit_logs");
    if (parseInt(auditCount.rows[0].count) === 0) {
      console.log("Seeding audit logs...");
      const filePath = path.join(dataDir, "audit_logs.json");
      if (fs.existsSync(filePath)) {
        const logs = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        for (const log of logs) {
          await client.query(
            "INSERT INTO audit_logs (id, timestamp, officer, action, query, case_id, ip, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [
              log.id, log.timestamp || new Date(), log.officer, log.action,
              log.query || "", log.caseId || null, log.ip || null, JSON.stringify(log.details || {})
            ]
          );
        }
      }
    }

    // Seed Tracks from metadata.csv (pointing to new ai-search location)
    const tracksCount = await client.query("SELECT COUNT(*) FROM tracks");
    if (parseInt(tracksCount.rows[0].count) === 0) {
      console.log("Seeding tracks from metadata.csv...");
      // projectRoot is D:\projects\E-Rakshak
      const projectRoot = path.join(__dirname, "..", "..", "..", "..");
      const csvPath = path.join(projectRoot, "ai-search (3)", "ai-search", "data", "input", "metadata.csv");
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, "utf-8");
        const lines = content.split("\n");
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = [];
          let insideQuote = false;
          let currentPart = "";
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
              parts.push(currentPart);
              currentPart = "";
            } else {
              currentPart += char;
            }
          }
          parts.push(currentPart);
          
          if (parts.length >= 18) {
            await client.query(
              "INSERT INTO tracks (id, camera_id, class_name, first_seen_time, last_seen_time, num_observations, max_confidence, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING",
              [
                parts[0], // track_id
                parts[1], // camera_id
                parts[2], // class_name
                parts[10], // first_seen
                parts[11], // last_seen
                10, // num_observations
                0.9, // max_confidence
                parts[17] ? parts[17].replace(/"/g, "") : "" // description
              ]
            );
          }
        }
      }
    }
    
    console.log("PostgreSQL Database Initialization Complete.");
  } catch (err) {
    console.error("Database connection/initialization failed. Make sure your PostgreSQL database exists and the credentials in backend/.env are correct.", err);
  } finally {
    if (client) {
      client.release();
    }
  }
}
