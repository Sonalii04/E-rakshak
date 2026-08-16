import savedSearchRepository from "../repositories/savedSearch.repository.js";
import { NotFoundError } from "../errors/appError.js";

class SavedSearchService {
    async getSavedSearches() {
        return savedSearchRepository.findAll();
    }

    async saveSearch(data, officerName = "System") {
        const item = {
            id: `SAVED-${Date.now()}`,
            name: data.name || "Untitled Search",
            query: data.query || "",
            filters: data.filters || {},
            createdBy: officerName,
            createdAt: new Date().toISOString()
        };
        return savedSearchRepository.save(item);
    }

    async deleteSavedSearch(id) {
        const item = await savedSearchRepository.findById(id);
        if (!item) {
            throw new NotFoundError(`Saved search with ID ${id} not found.`);
        }
        await savedSearchRepository.delete(id);
        return true;
    }
}

export default new SavedSearchService();
