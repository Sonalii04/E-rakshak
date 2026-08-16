import pool from "../database/db.js";

const mapCase = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    officer: c.officer,
    priority: c.priority,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    tags: typeof c.tags === "string" ? JSON.parse(c.tags) : (c.tags || []),
    evidence: typeof c.evidence === "string" ? JSON.parse(c.evidence) : (c.evidence || []),
    timeline: typeof c.timeline === "string" ? JSON.parse(c.timeline) : (c.timeline || []),
    notes: typeof c.notes === "string" ? JSON.parse(c.notes) : (c.notes || [])
  };
};

export class CaseRepository {
    async findAll() {
        const result = await pool.query("SELECT * FROM cases ORDER BY created_at DESC");
        return result.rows.map(mapCase);
    }

    async findById(id) {
        const result = await pool.query("SELECT * FROM cases WHERE id = $1", [id]);
        return result.rowCount > 0 ? mapCase(result.rows[0]) : null;
    }

    async save(newCase) {
        await pool.query(
            "INSERT INTO cases (id, title, description, officer, priority, status, created_at, updated_at, tags, evidence, timeline, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
            [
                newCase.id, newCase.title, newCase.description || "", newCase.officer,
                newCase.priority, newCase.status, newCase.createdAt || new Date(), newCase.updatedAt || new Date(),
                JSON.stringify(newCase.tags || []), JSON.stringify(newCase.evidence || []),
                JSON.stringify(newCase.timeline || []), JSON.stringify(newCase.notes || [])
            ]
        );
        return newCase;
    }

    async update(id, updates) {
        const existing = await this.findById(id);
        if (!existing) return null;

        const merged = { ...existing, ...updates };
        const now = new Date().toISOString();

        const result = await pool.query(
            "UPDATE cases SET title = $1, description = $2, officer = $3, priority = $4, status = $5, updated_at = $6, tags = $7, evidence = $8, timeline = $9, notes = $10 WHERE id = $11 RETURNING *",
            [
                merged.title, merged.description, merged.officer, merged.priority, merged.status, now,
                JSON.stringify(merged.tags), JSON.stringify(merged.evidence),
                JSON.stringify(merged.timeline), JSON.stringify(merged.notes), id
            ]
        );
        return mapCase(result.rows[0]);
    }

    async delete(id) {
        await pool.query("DELETE FROM cases WHERE id = $1", [id]);
        return true;
    }
}

export default new CaseRepository();
