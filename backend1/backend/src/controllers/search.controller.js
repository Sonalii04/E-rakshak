import searchService from "../services/search.service.js";
import investigationService from "../services/investigation.service.js";
import savedSearchService from "../services/savedSearch.service.js";
import historyService from "../services/history.service.js";
import aiSearchClient from "../integrations/aiSearchClient.js";

export const search = async (req, res, next) => {
    try {
        const { query, topK, filters } = req.body;
        const officerName = req.user?.username || "System";
        const results = await searchService.search(query, topK || null, filters || null, officerName);

        // Auto save to history
        await historyService.addHistory({
            query: query || "",
            resultCount: results.totalMatches,
            filters: filters || {},
            duration: results.statistics?.elapsed_ms_total || 0.0
        }, officerName);

        res.json(results);
    } catch (error) {
        next(error);
    }
};

export const getTrack = async (req, res, next) => {
    try {
        const { trackId } = req.params;
        const officerName = req.user?.username || "System";
        const track = await investigationService.getTrack(trackId, officerName);
        if (!track) {
            return res.status(404).json({ success: false, error: "Track not found" });
        }
        res.json(track);
    } catch (error) {
        next(error);
    }
};

export const getVehicle = async (req, res, next) => {
    try {
        const { vehicleNumber } = req.params;
        const officerName = req.user?.username || "System";
        const results = await investigationService.getVehicle(vehicleNumber, officerName);
        res.json(results);
    } catch (error) {
        next(error);
    }
};

export const similarSearch = async (req, res, next) => {
    try {
        const { trackId, topK, options } = req.body;
        const officerName = req.user?.username || "System";
        const results = await investigationService.similarObject(trackId, topK || 10, options || {}, officerName);
        res.json(results);
    } catch (error) {
        next(error);
    }
};

// Saved Searches endpoints
export const getSaved = async (req, res, next) => {
    try {
        const list = await savedSearchService.getSavedSearches();
        res.json(list);
    } catch (error) {
        next(error);
    }
};

export const postSaved = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        const saved = await savedSearchService.saveSearch(req.body, officerName);
        res.status(201).json(saved);
    } catch (error) {
        next(error);
    }
};

export const deleteSaved = async (req, res, next) => {
    try {
        await savedSearchService.deleteSavedSearch(req.params.id);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// Search History endpoints
export const getHistory = async (req, res, next) => {
    try {
        const list = await historyService.getHistory();
        res.json(list);
    } catch (error) {
        next(error);
    }
};

export const postHistory = async (req, res, next) => {
    try {
        const officerName = req.user?.username || "System";
        const item = await historyService.addHistory(req.body, officerName);
        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
};

export const deleteHistory = async (req, res, next) => {
    try {
        await historyService.deleteHistory(req.params.id);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// Static suggestions to avoid slow Python invocation on every keystroke
export const getSuggestions = async (req, res, next) => {
    try {
        const q = req.query.q || "";
        const allSuggestions = [
            "Person in red jacket",
            "White SUV near entrance",
            "Blue motorcycle near gate",
            "Person with black backpack",
            "Suspicious loitering near parking area",
            "Person in blue jeans and white shirt",
            "Vehicle near main road",
            "Person with gray jacket and navy jeans",
            "Person running near entrance gate",
            "Group of people near bus depot",
            "Person wearing hoodie",
            "White bus near parking",
        ];
        const filtered = q
            ? allSuggestions.filter(s => s.toLowerCase().includes(q.toLowerCase()))
            : allSuggestions;
        res.json(filtered);
    } catch (error) {
        next(error);
    }
};
