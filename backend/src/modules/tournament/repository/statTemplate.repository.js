const pool = require('../../../shared/database/pool');

class StatTemplateRepository {
  async getTemplates(tournamentId) {
    const res = await pool.query(
      `SELECT id, tournament_id, name, type
       FROM tournament_stat_templates 
       WHERE tournament_id = $1`,
      [tournamentId]
    );
    return res.rows;
  }

  async createTemplate(tournamentId, name, type) {
    const res = await pool.query(
      `INSERT INTO tournament_stat_templates (tournament_id, name, type)
       VALUES ($1, $2, $3)
       RETURNING id, tournament_id, name, type`,
      [tournamentId, name, type]
    );
    return res.rows[0];
  }

  async deleteTemplate(templateId, tournamentId) {
    const res = await pool.query(
      `DELETE FROM tournament_stat_templates 
       WHERE id = $1 AND tournament_id = $2
       RETURNING id`,
      [templateId, tournamentId]
    );
    return res.rows[0];
  }
}

module.exports = new StatTemplateRepository();
