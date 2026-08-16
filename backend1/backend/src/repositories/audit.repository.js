import pool from "../database/db.js";

const mapAuditLog = (l) => {
  if (!l) return null;
  return {
    id: l.id,
    timestamp: l.timestamp,
    officer: l.officer,
    action: l.action,
    query: l.query,
    caseId: l.case_id,
    ip: l.ip,
    details: typeof l.details === "string" ? JSON.parse(l.details) : (l.details || {})
  };
};

export class AuditRepository {
    async findAll() {
        const result = await pool.query("SELECT * FROM audit_logs ORDER BY timestamp DESC");
        return result.rows.map(mapAuditLog);
    }

    async findByCaseId(caseId) {
        const result = await pool.query("SELECT * FROM audit_logs WHERE case_id = $1 ORDER BY timestamp DESC", [caseId]);
        return result.rows.map(mapAuditLog);
    }

    async save(log) {
        await pool.query(
            "INSERT INTO audit_logs (id, timestamp, officer, action, query, case_id, ip, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [
                log.id, log.timestamp || new Date(), log.officer, log.action,
                log.query || "", log.caseId || null, log.ip || null, JSON.stringify(log.details || {})
            ]
        );
        return log;
    }
}

export default new AuditRepository();
