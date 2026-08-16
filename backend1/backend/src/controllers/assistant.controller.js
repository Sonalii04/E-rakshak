import investigationService from "../services/investigation.service.js";

export const investigate = async (req, res, next) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }
        const officerName = req.user?.username || "System";
        const results = await investigationService.investigate(query, officerName);
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        next(error);
    }
};