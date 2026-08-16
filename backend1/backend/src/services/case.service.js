import caseRepository from "../repositories/case.repository.js";
import timelineRepository from "../repositories/timeline.repository.js";
import auditRepository from "../repositories/audit.repository.js";
import { NotFoundError } from "../errors/appError.js";

export class CaseService {
    async getAllCases() {
        return caseRepository.findAll();
    }

    async getCase(id) {
        const c = await caseRepository.findById(id);
        if (!c) {
            throw new NotFoundError(`Case with ID ${id} not found.`);
        }
        return c;
    }

    async createCase(data, officerName = "System") {
        const newCase = {
            id: `CASE-${Date.now()}`,
            title: data.title || "Untitled Case",
            description: data.description || "",
            officer: data.officer || officerName,
            priority: data.priority || "Medium",
            status: "Open",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: data.tags || [],
            evidence: [],
            timeline: [],
            notes: []
        };
        const saved = await caseRepository.save(newCase);

        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "CREATE_CASE",
            caseId: saved.id,
            details: { title: saved.title }
        });

        return saved;
    }

    async updateCase(id, updates, officerName = "System") {
        const existing = await caseRepository.findById(id);
        if (!existing) {
            throw new NotFoundError(`Case with ID ${id} not found.`);
        }
        const updated = await caseRepository.update(id, updates);

        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "UPDATE_CASE",
            caseId: id,
            details: { updates }
        });

        return updated;
    }

    async deleteCase(id, officerName = "System") {
        const existing = await caseRepository.findById(id);
        if (!existing) {
            throw new NotFoundError(`Case with ID ${id} not found.`);
        }
        await caseRepository.delete(id);

        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "DELETE_CASE",
            caseId: id,
            details: { title: existing.title }
        });

        return true;
    }

    async addEvidenceToCase(caseId, evidence, officerName = "System") {
        const c = await caseRepository.findById(caseId);
        if (!c) {
            throw new NotFoundError(`Case with ID ${caseId} not found.`);
        }
        c.evidence.push(evidence);
        c.updatedAt = new Date().toISOString();
        await caseRepository.update(caseId, { evidence: c.evidence });

        await timelineRepository.save({
            id: `TL-${Date.now()}`,
            caseId,
            trackId: evidence.trackId,
            cameraId: evidence.cameraId,
            location: evidence.zone || evidence.cameraId,
            timestamp: evidence.timestamp || new Date().toISOString(),
            description: `Evidence Bookmarked: ${evidence.description || ""}`,
            metadata: evidence.metadata || {}
        });

        return c;
    }

    async removeEvidenceFromCase(caseId, trackId, officerName = "System") {
        const c = await caseRepository.findById(caseId);
        if (!c) {
            throw new NotFoundError(`Case with ID ${caseId} not found.`);
        }
        c.evidence = c.evidence.filter(e => e.trackId !== trackId);
        c.updatedAt = new Date().toISOString();
        await caseRepository.update(caseId, { evidence: c.evidence });

        await timelineRepository.deleteByTrackId(caseId, trackId);
        return c;
    }

    async addNoteToCase(caseId, note, officerName = "System") {
        const c = await caseRepository.findById(caseId);
        if (!c) {
            throw new NotFoundError(`Case with ID ${caseId} not found.`);
        }
        c.notes.push({
            author: note.author || officerName,
            text: note.text || "",
            time: new Date().toISOString()
        });
        c.updatedAt = new Date().toISOString();
        const updated = await caseRepository.update(caseId, { notes: c.notes });

        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "ADD_NOTE",
            caseId,
            details: { noteText: note.text }
        });

        return updated;
    }

    async removeNoteFromCase(caseId, index, officerName = "System") {
        const c = await caseRepository.findById(caseId);
        if (!c) {
            throw new NotFoundError(`Case with ID ${caseId} not found.`);
        }
        if (index < 0 || index >= c.notes.length) {
            throw new NotFoundError(`Note index ${index} is invalid.`);
        }
        const removed = c.notes.splice(index, 1);
        c.updatedAt = new Date().toISOString();
        const updated = await caseRepository.update(caseId, { notes: c.notes });

        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "REMOVE_NOTE",
            caseId,
            details: { noteIndex: index, noteText: removed[0]?.text }
        });

        return updated;
    }
}

export default new CaseService();
