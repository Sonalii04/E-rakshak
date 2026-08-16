import pool from "../database/db.js";

const mapUser = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    role: u.role,
    createdAt: u.created_at
  };
};

export class UserRepository {
    async findByUsername(username) {
        const result = await pool.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);
        return result.rowCount > 0 ? mapUser(result.rows[0]) : null;
    }

    async save(user) {
        await pool.query(
            "INSERT INTO users (id, username, password, role, created_at) VALUES ($1, $2, $3, $4, $5)",
            [user.id, user.username, user.password, user.role, user.createdAt || new Date()]
        );
        return user;
    }
}

export default new UserRepository();
