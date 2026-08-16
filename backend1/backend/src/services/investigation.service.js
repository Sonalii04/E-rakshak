import fs from "fs";
import path from "path";
import { paths } from "../config/paths.js";
import aiSearchClient from "../integrations/aiSearchClient.js";
import auditRepository from "../repositories/audit.repository.js";

function getSnapshotUrl(trackId, objectType = "Person") {
    const cropDir = path.resolve(paths.aiSearchRoot, "data/input/crops");
    // Check if best_keyframe exists
    if (fs.existsSync(path.join(cropDir, `${trackId}_best_keyframe.jpg`))) {
        return `/api/uploads/crops/${trackId}_best_keyframe.jpg`;
    }
    if (fs.existsSync(path.join(cropDir, `${trackId}_highest_quality_keyframe.jpg`))) {
        return `/api/uploads/crops/${trackId}_highest_quality_keyframe.jpg`;
    }
    // Fallback: search directory for first file matching trackId
    try {
        if (fs.existsSync(cropDir)) {
            const files = fs.readdirSync(cropDir);
            const match = files.find(f => f.startsWith(trackId) && f.endsWith(".jpg"));
            if (match) return `/api/uploads/crops/${match}`;
        }
    } catch (e) {}

    // Ultimate fallback: high-quality Unsplash image to prevent broken icons
    if (objectType.toLowerCase() === "vehicle") {
        return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=60"; // White SUV
    }
    return "https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=400&q=60"; // Person
}

class InvestigationService {
    async investigate(query, officerName = "System") {
        const response = await aiSearchClient.execute(query);

        // Normalize response keys to match backend/frontend camelCase expectations
        const mapped = this.normalizeResponse(response);

        // Save audit entry
        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "INVESTIGATION",
            query,
            details: {
                totalMatches: mapped.totalMatches,
                confidence: mapped.confidence
            }
        });

        return mapped;
    }

    async search(query, topK = null, filters = null, officerName = "System") {
        const response = await aiSearchClient.execute(query, topK, filters);
        const mapped = this.normalizeResponse(response);

        // Save audit entry
        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "SEARCH",
            query: query || "",
            details: {
                filters,
                totalMatches: mapped.totalMatches
            }
        });

        return mapped;
    }

    async similarObject(trackId, topK = 10, options = {}, officerName = "System") {
        // Option properties: sameCamera, differentCameras, timeWindowSeconds, sameClass, sameColor, sameVehicleType
        // Map camelCase options to snake_case for python integration
        const pyOptions = {
            same_camera: options.sameCamera || false,
            different_cameras: options.differentCameras || false,
            time_window_seconds: options.timeWindowSeconds || null,
            same_class: options.sameClass || false,
            same_color: options.sameColor || false,
            same_vehicle_type: options.sameVehicleType || false
        };

        const results = await aiSearchClient.execute(trackId, topK, pyOptions);

        // Return similar results format mapped to camelCase
        const mappedResults = (results || []).map(r => this.normalizeResultItem(r));

        await auditRepository.save({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            officer: officerName,
            action: "SIMILAR_SEARCH",
            query: trackId,
            details: {
                topK,
                options,
                resultCount: mappedResults.length
            }
        });

        return mappedResults;
    }

    async getTrack(trackId, officerName = "System") {
        // Direct track lookup using filters bypass
        const response = await aiSearchClient.execute("", null, { track_id: trackId });
        const mapped = this.normalizeResponse(response);
        return mapped.results[0] || null;
    }

    async getVehicle(vehicleNumber, officerName = "System") {
        // Direct vehicle lookup using filters bypass
        const response = await aiSearchClient.execute("", null, { vehicle_number: vehicleNumber });
        const mapped = this.normalizeResponse(response);
        return mapped.results;
    }

    normalizeResponse(response) {
        const results = (response.results || []).map(r => this.normalizeResultItem(r));
        const invest = response.investigation || {};
        const stats = invest.statistics || {};

        return {
            query: response.query || "",
            results: results,
            totalMatches: response.total_matches || results.length,
            confidence: stats.confidence || 0.0,
            summary: invest.summary || "",
            timeline: invest.timeline || [],
            route: invest.route || [],
            lifecycle: invest.lifecycle || [],
            statistics: stats,
            suggestions: response.suggestions || []
        };
    }

    normalizeResultItem(r) {
        const objectType = r.class_name ? r.class_name.charAt(0).toUpperCase() + r.class_name.slice(1) : "Person";
        
        let vehicleType = r.vehicle_type || "-";
        if (vehicleType && vehicleType.toLowerCase() !== "unknown" && vehicleType !== "-") {
            vehicleType = vehicleType.toUpperCase() === "SUV" ? "SUV" : (vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1));
        } else {
            vehicleType = "-";
        }

        let color = r.color || "-";
        if (color && color.toLowerCase() !== "unknown" && color !== "-") {
            color = color.charAt(0).toUpperCase() + color.slice(1);
        } else {
            color = "-";
        }

        // Map location from camera_id
        let location = r.camera_id || "Unknown";
        if (location && location !== "Unknown") {
            location = location.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }

        // Determine clothing description
        let clothing = "-";
        if (objectType === "Person") {
            const upper = r.upper_body && r.upper_body !== "unknown" ? `${r.upper_body} top` : "";
            const lower = r.lower_body && r.lower_body !== "unknown" ? `${r.lower_body} bottoms` : "";
            if (upper && lower) {
                clothing = `${upper}, ${lower}`;
            } else if (upper || lower) {
                clothing = upper || lower;
            }
        }

        // Locate snapshot URL using our new helper
        const snapshot = getSnapshotUrl(r.track_id, objectType);

        return {
            id: r.track_id, // Mandatory for ResultCard (result.id)
            trackId: r.track_id,
            cameraId: r.camera_id,
            className: r.class_name,
            category: r.category || "",
            detectedType: r.detected_type || "",
            objectType: objectType, // Mandatory for ResultCard (result.objectType)
            vehicleType: vehicleType, // Mandatory for ResultCard (result.vehicleType)
            vehicleNumber: r.vehicle_number || "",
            color: color, // Mandatory for ResultCard (result.color)
            clothing: clothing, // Mandatory for ResultCard (result.clothing)
            upperBody: r.upper_body || "",
            lowerBody: r.lower_body || "",
            firstSeenTime: r.first_seen_time,
            lastSeenTime: r.last_seen_time,
            timestamp: r.first_seen_time, // Mandatory for ResultCard (result.timestamp)
            duration: r.duration || 0.0,
            zone: r.zone || "",
            events: r.events || "",
            groupSize: r.group_size || 1,
            nearVehicle: r.near_vehicle || "",
            description: r.description || "",
            vlmDescription: r.vlm_description || "",
            similarity: r.final_score || r.similarity_score || 0.0,
            confidence: Math.round((r.final_score || r.similarity_score || 0.0) * 100), // Mandatory for ResultCard (result.confidence)
            snapshot: snapshot, // Mandatory for ResultCard (result.snapshot)
            location: location, // Mandatory for ResultCard (result.location)
            metadata: {
                semanticScore: r.semantic_score || r.clip_score || 0.0,
                metadataScore: r.metadata_score || 0.0,
                descriptionScore: r.description_score || 0.0,
                vlmScore: r.vlm_score || 0.0,
                eventScore: r.event_score || 0.0,
                vehicleNumberScore: r.vehicle_number_score || 0.0
            }
        };
    }
}

export default new InvestigationService();