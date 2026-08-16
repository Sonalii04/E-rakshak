import pool from "../database/db.js";

const mapReport = (r) => {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    format: r.format || "PDF",
    generatedAt: r.date,
    generatedBy: r.user_name,
    hash: r.hash || "",
    query: r.query || "",
    cameras: typeof r.cameras === "string" ? JSON.parse(r.cameras) : (r.cameras || []),
    rangeStart: r.range_start,
    rangeEnd: r.range_end,
    matches: r.matches || 0
  };
};

export class ReportRepository {
    async findAll() {
        const result = await pool.query("SELECT * FROM reports ORDER BY date DESC");
        return result.rows.map(mapReport);
    }

    async save(report) {
        const id = report.id || `REPORT-${Date.now()}`;
        const hash = report.hash || `SHA-256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
        const format = report.format || "PDF";
        const generatedAt = report.generatedAt || new Date().toISOString();
        
        await pool.query(
            `INSERT INTO reports (id, title, format, date, user_name, hash, query, cameras, range_start, range_end, matches) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                id,
                report.title,
                format,
                generatedAt,
                report.generatedBy || "System",
                hash,
                report.query || "",
                JSON.stringify(report.cameras || []),
                report.rangeStart || null,
                report.rangeEnd || null,
                report.matches || 0
            ]
        );
        
        return {
            ...report,
            id,
            hash,
            format,
            generatedAt
        };
    }
}

export default new ReportRepository();
