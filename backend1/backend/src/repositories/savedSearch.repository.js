import pool from "../database/db.js";

const mapSavedSearch = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    query: s.query,
    timestamp: s.timestamp,
    officer: s.officer,
    name: s.name,
    filters: typeof s.filters === "string" ? JSON.parse(s.filters) : (s.filters || {})
  };
};

export class SavedSearchRepository {
    async findAll() {
        const result = await pool.query("SELECT * FROM saved_searches ORDER BY timestamp DESC");
        return result.rows.map(mapSavedSearch);
    }

    async findById(id) {
        const result = await pool.query("SELECT * FROM saved_searches WHERE id = $1", [id]);
        return result.rowCount > 0 ? mapSavedSearch(result.rows[0]) : null;
    }

    async save(item) {
        await pool.query(
            "INSERT INTO saved_searches (id, query, timestamp, officer, name, filters) VALUES ($1, $2, $3, $4, $5, $6)",
            [
                item.id, item.query, item.timestamp || new Date(), item.officer,
                item.name || "", JSON.stringify(item.filters || {})
            ]
        );
        return item;
    }

    async delete(id) {
        await pool.query("DELETE FROM saved_searches WHERE id = $1", [id]);
        return true;
    }
}

export default new SavedSearchRepository();
