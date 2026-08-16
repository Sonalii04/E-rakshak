import pool from "../database/db.js";
import fs from "fs";
import path from "path";
import { paths } from "../config/paths.js";

class MetricsService {
    async getDashboardStats() {
        // Use fast DB queries instead of triggering AI search
        const [casesRes, evidenceRes, auditsRes, tracksRes, camerasRes] = await Promise.all([
            pool.query("SELECT id, status FROM cases"),
            pool.query("SELECT id FROM evidence"),
            pool.query("SELECT id, action FROM audit_logs ORDER BY timestamp DESC LIMIT 100"),
            pool.query("SELECT COUNT(*) as count FROM tracks"),
            pool.query("SELECT COUNT(*) as count FROM cameras"),
        ]);

        const cases = casesRes.rows;
        const audits = auditsRes.rows;

        const openCases = cases.filter(c => c.status?.toLowerCase() === "open").length;
        const closedCases = cases.filter(c => c.status?.toLowerCase() === "closed").length;

        const totalInvestigations = audits.filter(a => a.action === "INVESTIGATION").length;
        const searchCount = audits.filter(a => a.action === "SEARCH").length;

        // Count crops from disk (fast, no Python invocation)
        let cropCount = 0;
        try {
            const cropDir = path.join(paths.aiSearchRoot, "data", "input", "crops");
            if (fs.existsSync(cropDir)) {
                cropCount = fs.readdirSync(cropDir).filter(f => f.endsWith(".jpg")).length;
            }
        } catch (e) {}

        return {
            totalCases: cases.length,
            openCases,
            closedCases,
            totalEvidence: evidenceRes.rows.length,
            totalInvestigations,
            searchCount,
            cameraCount: parseInt(camerasRes.rows[0]?.count || 0),
            trackCount: parseInt(tracksRes.rows[0]?.count || 0),
            cropCount,
            events: {},
            recentInvestigations: audits.filter(a => a.action === "INVESTIGATION").slice(0, 5)
        };
    }
}

export default new MetricsService();
