import pool from "../database/db.js";

const mapTimelineEvent = (t) => {
  if (!t) return null;
  return {
    id: t.id,
    caseId: t.case_id,
    trackId: t.track_id,
    cameraId: t.camera_id,
    location: t.location,
    timestamp: t.timestamp,
    description: t.description,
    metadata: typeof t.metadata === "string" ? JSON.parse(t.metadata) : (t.metadata || {})
  };
};

export class TimelineRepository {
    async findAll() {
        const result = await pool.query("SELECT * FROM timeline_events ORDER BY timestamp ASC");
        return result.rows.map(mapTimelineEvent);
    }

    async findByCaseId(caseId) {
        const result = await pool.query("SELECT * FROM timeline_events WHERE case_id = $1 ORDER BY timestamp ASC", [caseId]);
        return result.rows.map(mapTimelineEvent);
    }

    async save(event) {
        await pool.query(
            "INSERT INTO timeline_events (id, case_id, track_id, camera_id, location, timestamp, description, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [
                event.id, event.caseId, event.trackId, event.cameraId,
                event.location || "", event.timestamp || new Date(), event.description || "",
                JSON.stringify(event.metadata || {})
            ]
        );
        return event;
    }

    async delete(id) {
        await pool.query("DELETE FROM timeline_events WHERE id = $1", [id]);
        return true;
    }

    async deleteByTrackId(caseId, trackId) {
        await pool.query("DELETE FROM timeline_events WHERE case_id = $1 AND track_id = $2", [caseId, trackId]);
        return true;
    }
}

export default new TimelineRepository();
