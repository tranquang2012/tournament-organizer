const pool = require("../../../shared/database/pool");
const User = require("../model/user.model");

const findById = async (userId) => {
  const result = await pool.query(
    `
      SELECT id, email, full_name, role
      FROM public.user_roles
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ? User.fromDatabase(result.rows[0]) : null;
};

module.exports = {
  findById,
};
