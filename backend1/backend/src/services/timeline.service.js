import timelineRepository from "../repositories/timeline.repository.js";
import caseRepository from "../repositories/case.repository.js";
import { NotFoundError } from "../errors/appError.js";

export class TimelineService {
    async getTimelineForCase(caseId) {
        const events = await timelineRepository.findByCaseId(caseId);
        return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    async addEvent(data) {
        const c = await caseRepository.findById(data.caseId);
        if (!c) {
            throw new NotFoundError(`Case with ID ${data.caseId} not found.`);
        }

        const event = {
            id: `TL-${Date.now()}`,
            caseId: data.caseId,
            trackId: data.trackId || "",
            cameraId: data.cameraId || "",
            location: data.location || "",
            timestamp: data.timestamp || new Date().toISOString(),
            description: data.description || "",
            metadata: data.metadata || {}
        };

        const saved = await timelineRepository.save(event);
        return saved;
    }
}

export default new TimelineService();
