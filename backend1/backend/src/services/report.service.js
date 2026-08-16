import caseRepository from "../repositories/case.repository.js";
import timelineRepository from "../repositories/timeline.repository.js";
import evidenceRepository from "../repositories/evidence.repository.js";
import auditRepository from "../repositories/audit.repository.js";
import { NotFoundError } from "../errors/appError.js";

class ReportService {
    async generateReport(caseId) {
        const c = await caseRepository.findById(caseId);
        if (!c) {
            throw new NotFoundError(`Case with ID ${caseId} not found.`);
        }

        const caseTimeline = await timelineRepository.findByCaseId(caseId);
        caseTimeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const caseEvidence = await evidenceRepository.findByCaseId(caseId);
        const caseLogs = await auditRepository.findByCaseId(caseId);

        const cameras = [...new Set(caseTimeline.map(t => t.cameraId).filter(Boolean))];
        const tracks = [...new Set(caseTimeline.map(t => t.trackId).filter(Boolean))];

        const firstSeen = caseTimeline.length > 0 ? caseTimeline[0].timestamp : null;
        const lastSeen = caseTimeline.length > 0 ? caseTimeline[caseTimeline.length - 1].timestamp : null;

        // Dynamic summary
        const summary = {
            title: c.title,
            description: c.description,
            officer: c.officer,
            priority: c.priority,
            status: c.status,
            firstSeen,
            lastSeen,
            totalTimelineEvents: caseTimeline.length,
            totalEvidence: caseEvidence.length,
            totalAuditLogs: caseLogs.length,
            totalTracks: tracks.length,
            totalCameras: cameras.length
        };

        return {
            reportId: `REPORT-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            case: c,
            summary,
            timeline: caseTimeline,
            evidence: caseEvidence,
            auditLogs: caseLogs,
            statistics: {
                cameras,
                tracks,
                evidenceCount: caseEvidence.length,
                timelineCount: caseTimeline.length,
                auditCount: caseLogs.length
            }
        };
    }
}

export default new ReportService();