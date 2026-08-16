import pool from "../database/db.js";

const mapEvidence = (e) => {
  if (!e) return null;
  return {
    id: e.id,
    caseId: e.case_id,
    trackId: e.track_id,
    cameraId: e.camera_id,
    timestamp: e.timestamp,
    className: e.class_name,
    description: e.description,
    similarity: e.similarity,
    thumbnail: e.thumbnail,
    metadata: typeof e.metadata === "string" ? JSON.parse(e.metadata) : (e.metadata || {})
  };
};

export class EvidenceRepository {
    async findAll() {
        const result = await pool.query("SELECT * FROM evidence ORDER BY timestamp DESC");
        return result.rows.map(mapEvidence);
    }

    async findById(id) {
        const result = await pool.query("SELECT * FROM evidence WHERE id = $1", [id]);
        return result.rowCount > 0 ? mapEvidence(result.rows[0]) : null;
    }

    async findByCaseId(caseId) {
        const result = await pool.query("SELECT * FROM evidence WHERE case_id = $1 ORDER BY timestamp DESC", [caseId]);
        return result.rows.map(mapEvidence);
    }

    async save(item) {
        await pool.query(
            "INSERT INTO evidence (id, case_id, track_id, camera_id, timestamp, class_name, description, similarity, thumbnail, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            [
                item.id, item.caseId, item.trackId, item.cameraId,
                item.timestamp || null, item.className || null, item.description || null,
                item.similarity || null, item.thumbnail || "", JSON.stringify(item.metadata || {})
            ]
        );
        return item;
    }

    async delete(id) {
        await pool.query("DELETE FROM evidence WHERE id = $1", [id]);
        return true;
    }

    async deleteByTrackId(caseId, trackId) {
        await pool.query("DELETE FROM evidence WHERE case_id = $1 AND track_id = $2", [caseId, trackId]);
        return true;
    }
}

export default new EvidenceRepository();
