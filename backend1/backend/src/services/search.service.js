import investigationService from "./investigation.service.js";

class SearchService {
    async search(query, topK = null, filters = null, officerName = "System") {
        return investigationService.search(query, topK, filters, officerName);
    }
}

export default new SearchService();