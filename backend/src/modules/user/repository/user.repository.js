const pool = require("../../../shared/database/pool");
const User = require("../model/user.model");

const findById = async (userId) => {
  const result = await pool.query(
    `
      SELECT id, email, full_name, role, avatar_url, is_disable
      FROM public.user_roles
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ? User.fromDatabase(result.rows[0]) : null;
};

const findAll = async () => {
  const result = await pool.query(
    `
      SELECT id, email, full_name, role, avatar_url, is_disable
      FROM public.user_roles
      ORDER BY full_name ASC NULLS LAST, email ASC
    `
  );

  return result.rows.map(User.fromDatabase);
};

const updateById = async (userId, updates) => {
  const fields = [];
  const values = [];

  if (Object.prototype.hasOwnProperty.call(updates, "fullName")) {
    values.push(updates.fullName);
    fields.push(`full_name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "avatarUrl")) {
    values.push(updates.avatarUrl);
    fields.push(`avatar_url = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "role")) {
    values.push(updates.role);
    fields.push(`role = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "isDisable")) {
    values.push(updates.isDisable);
    fields.push(`is_disable = $${values.length}`);
  }

  if (fields.length === 0) {
    return findById(userId);
  }

  values.push(userId);

  const result = await pool.query(
    `
      UPDATE public.user_roles
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, email, full_name, role, avatar_url, is_disable
    `,
    values
  );

  return result.rows[0] ? User.fromDatabase(result.rows[0]) : null;
};

module.exports = {
  findById,
  findAll,
  updateById,
};
