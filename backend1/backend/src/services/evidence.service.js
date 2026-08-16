import evidenceRepository from "../repositories/evidence.repository.js";
import caseRepository from "../repositories/case.repository.js";
import auditRepository from "../repositories/audit.repository.js";
import timelineRepository from "../repositories/timeline.repository.js";
import { NotFoundError, ValidationError } from "../errors/appError.js";

export class EvidenceService {
    async getEvidence() {
        return evidenceRepository.findAll();
    }

    async getEvidenceById(id) {
        const item = await evidenceRepository.findById(id);
        if (!item) {
            throw new NotFoundError(`Evidence with ID ${id} not found.`);
        }
        return item;
    }

    async getEvidenceForCase(caseId) {
        return evidenceRepository.findByCaseId(caseId);
    }

    async bookmarkEvidence(data, officerName = "System") {
        if (!data.caseId) {
            throw new ValidationError("Case ID is required to bookmark evidence.");
        }
        const c = await caseRepository.findById(data.caseId);
        if (!c) {
            throw new NotFoundError(`Case with ID ${data.caseId} not found.`);
        }

        const item = {
            id: `EV-${Date.now()}`,
            caseId: data.caseId,
            trackId: data.trackId || "",
            cameraId: data.cameraId || "",
            timestamp: data.timestamp || new Date().toISOString(),
            className: data.className || data.class || "",
            category: data.category || "",
            detectedType: data.detectedType || "",
            vehicleType: data.vehicleType || "",
            vehicleNumber: data.vehicleNumber || "",
            color: data.color || "",
            upperBody: data.upperBody || "",
            lowerBody: data.lowerBody || "",
            zone: data.zone || "",
            events: data.events || "",
            groupSize: Number(data.groupSize) || 1,
            nearVehicle: data.nearVehicle || "",
            description: data.description || "",
            vlmDescription: data.vlmDescription || "",
            similarity: Number(data.similarity) || 0.0,
            thumbnail: data.thumbnail || "",
            metadata: data.metadata || {},
            officer: data.officer || officerName
        };

        const saved = await evidenceRepository.save(item);

        // Attach evidence ID to case
        c.evidence.push(saved);
        c.updatedAt = new Date().toISOString();
        await caseRepository.update(data.caseId, { evidence: c.evidence });

        // Add to timeline
        await timelineRepository.save({
            id: `TL-${Date.now()}`,
            caseId: data.caseId,
            trackId: saved.trackId,
            cameraId: saved.cameraId,
            location: saved.zone || saved.cameraId,
            timestamp: saved.timestamp,
            description: `Evidence Bookmarked: ${saved.description}`,
            metadata: saved.metadata
        });

        // Log audit
        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "BOOKMARK_EVIDENCE",
            caseId: data.caseId,
            details: {
                evidenceId: saved.id,
                trackId: saved.trackId,
                cameraId: saved.cameraId
            }
        });

        return saved;
    }

    async removeEvidence(id, officerName = "System") {
        const item = await evidenceRepository.findById(id);
        if (!item) {
            throw new NotFoundError(`Evidence with ID ${id} not found.`);
        }
        await evidenceRepository.delete(id);

        // Remove from case evidence list
        const c = await caseRepository.findById(item.caseId);
        if (c) {
            c.evidence = c.evidence.filter(e => e.id !== id);
            c.updatedAt = new Date().toISOString();
            await caseRepository.update(item.caseId, { evidence: c.evidence });
        }

        // Remove from timeline
        await timelineRepository.deleteByTrackId(item.caseId, item.trackId);

        // Log audit
        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "REMOVE_EVIDENCE",
            caseId: item.caseId,
            details: {
                evidenceId: id,
                trackId: item.trackId
            }
        });

        return true;
    }
}

export default new EvidenceService();
