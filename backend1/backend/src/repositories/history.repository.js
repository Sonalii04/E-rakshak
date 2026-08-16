import pool from "../database/db.js";

const mapHistoryItem = (h) => {
  if (!h) return null;
  return {
    id: h.id,
    query: h.query,
    timestamp: h.timestamp,
    officer: h.officer,
    resultCount: h.result_count,
    filters: typeof h.filters === "string" ? JSON.parse(h.filters) : (h.filters || {}),
    duration: h.duration
  };
};

export class SearchHistoryRepository {
    async findAll() {
        const result = await pool.query("SELECT * FROM search_history ORDER BY timestamp DESC");
        return result.rows.map(mapHistoryItem);
    }

    async save(item) {
        await pool.query(
            "INSERT INTO search_history (id, query, timestamp, officer, result_count, filters, duration) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [
                item.id, item.query, item.timestamp || new Date(), item.officer,
                item.resultCount || 0, JSON.stringify(item.filters || {}), item.duration || 0.0
            ]
        );
        return item;
    }

    async delete(id) {
        await pool.query("DELETE FROM search_history WHERE id = $1", [id]);
        return true;
    }

    async clear() {
        await pool.query("TRUNCATE TABLE search_history");
        return true;
    }
}

export default new SearchHistoryRepository();
