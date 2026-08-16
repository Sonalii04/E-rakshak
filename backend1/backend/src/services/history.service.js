import historyRepository from "../repositories/history.repository.js";

class SearchHistoryService {
    async getHistory() {
        return historyRepository.findAll();
    }

    async addHistory(data, officerName = "System") {
        const item = {
            id: `HIST-${Date.now()}`,
            query: data.query || "",
            timestamp: new Date().toISOString(),
            officer: officerName,
            resultCount: Number(data.resultCount) || 0,
            filters: data.filters || {},
            duration: Number(data.duration) || 0.0
        };
        return historyRepository.save(item);
    }

    async deleteHistory(id) {
        await historyRepository.delete(id);
        return true;
    }
}

export default new SearchHistoryService();
