const pool = require("../../../shared/database/pool");
const Sport = require("../model/sport.model");

const SPORT_SELECT = `
  SELECT sport_id, sport_name, sport_type, sport_banner, sport_format
  FROM public.sport
`;

const findAll = async () => {
  const result = await pool.query(
    `
      ${SPORT_SELECT}
      ORDER BY sport_id ASC
    `
  );

  return result.rows.map(Sport.fromDatabase);
};

const findById = async (sportId) => {
  const result = await pool.query(
    `
      ${SPORT_SELECT}
      WHERE sport_id = $1
      LIMIT 1
    `,
    [sportId]
  );

  return result.rows[0] ? Sport.fromDatabase(result.rows[0]) : null;
};

module.exports = {
  findAll,
  findById,
};
