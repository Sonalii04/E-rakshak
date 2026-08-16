import metricsService from "../services/metrics.service.js";
import pool from "../database/db.js";

export const dashboard = async (req, res, next) => {
    try {
        const stats = await metricsService.getDashboardStats();

        // Build recent search history from audit logs
        const auditRes = await pool.query(
            `SELECT action, details, timestamp, officer, query FROM audit_logs 
             WHERE action IN ('SEARCH','INVESTIGATION') 
             ORDER BY timestamp DESC LIMIT 20`
        );

        const searches = auditRes.rows.map(row => ({
            query: row.query || "—",
            operator: row.officer || "System",
            status: row.action === "SEARCH"
                ? `Completed (${row.details?.totalMatches ?? row.details?.resultCount ?? 0} results)`
                : `Investigation`,
        }));

        // 1. Searches Per Day (last 7 days)
        const getPast7Days = () => {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push({
                    day: d.toLocaleDateString("en-US", { weekday: "short" }),
                    searches: 0
                });
            }
            return days;
        };
        const past7Days = getPast7Days();

        const searchStatsRes = await pool.query(
            `SELECT TO_CHAR(timestamp, 'Dy') as day, COUNT(*) as count 
             FROM audit_logs 
             WHERE action IN ('SEARCH', 'INVESTIGATION') AND timestamp >= NOW() - INTERVAL '7 days' 
             GROUP BY day, DATE_TRUNC('day', timestamp)
             ORDER BY DATE_TRUNC('day', timestamp)`
        );
        for (const row of searchStatsRes.rows) {
            const match = past7Days.find(d => d.day === row.day);
            if (match) match.searches = parseInt(row.count || 0);
        }

        // 2. Detection Stats (Monthly trend for last 6 months)
        const getPast6Months = () => {
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                months.push({
                    month: d.toLocaleDateString("en-US", { month: "short" }),
                    persons: 0,
                    vehicles: 0
                });
            }
            return months;
        };
        const past6Months = getPast6Months();

        const detectionStatsRes = await pool.query(
            `SELECT TO_CHAR(first_seen_time, 'Mon') as month,
                    COUNT(CASE WHEN LOWER(class_name) = 'person' THEN 1 END) as persons,
                    COUNT(CASE WHEN LOWER(class_name) != 'person' THEN 1 END) as vehicles
             FROM tracks
             WHERE first_seen_time >= NOW() - INTERVAL '6 months'
             GROUP BY month, DATE_TRUNC('month', first_seen_time)
             ORDER BY DATE_TRUNC('month', first_seen_time)`
        );
        for (const row of detectionStatsRes.rows) {
            const match = past6Months.find(m => m.month === row.month);
            if (match) {
                match.persons = parseInt(row.persons || 0);
                match.vehicles = parseInt(row.vehicles || 0);
            }
        }

        // 3. Camera Activity (Hourly detections)
        const getActivityHours = () => {
            const hours = [];
            for (let i = 0; i < 24; i += 2) {
                hours.push({
                    hour: `${String(i).padStart(2, '0')}:00`,
                    activity: 0
                });
            }
            return hours;
        };
        const activityHours = getActivityHours();

        const cameraActivityRes = await pool.query(
            `SELECT EXTRACT(HOUR FROM first_seen_time) as hr, COUNT(*) as count
             FROM tracks
             GROUP BY hr`
        );
        for (const row of cameraActivityRes.rows) {
            const hr = parseInt(row.hr || 0);
            // Map to nearest 2-hour interval
            const intervalHr = Math.floor(hr / 2) * 2;
            const hourLabel = `${String(intervalHr).padStart(2, '0')}:00`;
            const match = activityHours.find(h => h.hour === hourLabel);
            if (match) match.activity += parseInt(row.count || 0);
        }

        // 4. Object Distribution
        const objectDistributionRes = await pool.query(
            `SELECT class_name as raw_name, COUNT(*) as count
             FROM tracks
             GROUP BY class_name`
        );
        const colorMap = {
            person: "#2563EB",
            vehicle: "#22C55E",
            bag: "#EAB308",
            weapon: "#EF4444",
            animal: "#A855F7"
        };
        const objectDistribution = objectDistributionRes.rows.map(row => {
            const name = row.raw_name ? row.raw_name.charAt(0).toUpperCase() + row.raw_name.slice(1) : "Unknown";
            return {
                name,
                value: parseInt(row.count || 0),
                color: colorMap[row.raw_name?.toLowerCase()] || "#A855F7"
            };
        });

        // 5. Recent Exports (from reports table)
        const recentExportsRes = await pool.query(
            `SELECT id, title, format, user_name as user, date 
             FROM reports 
             ORDER BY date DESC LIMIT 5`
        );
        const recentExports = recentExportsRes.rows.map(row => ({
            id: row.id,
            title: row.title,
            format: row.format,
            user: row.user,
            date: row.date
        }));

        // Build overview shape the frontend expects
        const overview = {
            totalCameras: stats.cameraCount,
            videosIndexed: stats.trackCount,
            activeSearches: stats.searchCount,
            objectsDetected: stats.cropCount || stats.trackCount,
            processingQueue: 0,
            totalCases: stats.totalCases,
            openCases: stats.openCases,
            closedCases: stats.closedCases,
            totalEvidence: stats.totalEvidence,
        };

        res.json({
            overview,
            alerts: [],   // Extend later with a real alerts table
            searches,
            recentInvestigations: stats.recentInvestigations || [],
            searchesPerDay: past7Days,
            detectionStats: past6Months,
            cameraActivity: activityHours,
            objectDistribution,
            recentExports
        });
    } catch (error) {
        next(error);
    }
};