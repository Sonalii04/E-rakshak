import pool from "../database/db.js";

export const getCameras = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM cameras ORDER BY id");
    // Map last_active back to camelCase to match the frontend expectations
    const cameras = result.rows.map(c => ({
      id: c.id,
      name: c.name,
      location: c.location,
      status: c.status,
      lastActive: c.last_active,
      resolution: c.resolution
    }));
    res.json(cameras);
  } catch (err) {
    next(err);
  }
};

export const updateCameraStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const lastActive = new Date().toISOString();
    const result = await pool.query(
      "UPDATE cameras SET status = $1, last_active = $2 WHERE id = $3 RETURNING *",
      [status, lastActive, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Camera not found" });
    }

    const c = result.rows[0];
    res.json({
      id: c.id,
      name: c.name,
      location: c.location,
      status: c.status,
      lastActive: c.last_active,
      resolution: c.resolution
    });
  } catch (err) {
    next(err);
  }
};
