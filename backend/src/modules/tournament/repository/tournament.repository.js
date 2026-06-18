const pool = require('../../../shared/database/pool');

class TournamentRepository {
  //Step 1

  async create(data, organizerId) {
    const { tour_name, tour_descrip, tour_locat, tour_startdate, tour_enddate, tour_banner } = data;

    const { rows } = await pool.query(
      `INSERT INTO tournament
         (tour_name, tour_descrip, tour_locat, tour_startdate, tour_enddate,
          tour_banner, tour_status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',$7)
       RETURNING *`,
      [tour_name, tour_descrip, tour_locat, tour_startdate, tour_enddate, tour_banner, organizerId]
    );
    return rows[0];
  }

  async updateGeneralDetails(tourId, data, organizerId) {
    const { tour_name, tour_descrip, tour_locat, tour_startdate, tour_enddate, tour_banner } = data;

    const { rows } = await pool.query(
      `UPDATE tournament
       SET tour_name=$1, tour_descrip=$2, tour_locat=$3,
           tour_startdate=$4, tour_enddate=$5, tour_banner=$6
       WHERE tour_id=$7 AND created_by=$8
       RETURNING *`,
      [tour_name, tour_descrip, tour_locat, tour_startdate, tour_enddate, tour_banner, tourId, organizerId]
    );
    return rows[0] || null;
  }

  //Step 2

  async saveSportAndParticipants(tourId, { sp_id, participant_type, participants }, organizerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: tourRows } = await client.query(
        `UPDATE tournament
         SET sp_id=$1
         WHERE tour_id=$2 AND created_by=$3
         RETURNING *`,
        [sp_id, tourId, organizerId]
      );
      if (!tourRows[0]) throw new Error('Tournament not found or access denied.');

      const { rows: existingComps } = await client.query(
        `SELECT comp_id FROM competitors WHERE tour_id=$1`,
        [tourId]
      );
      if (existingComps.length > 0) {
        const compIds = existingComps.map(r => r.comp_id);
        await client.query(
          `DELETE FROM teammember WHERE comp_id = ANY($1::uuid[])`,
          [compIds]
        );
        await client.query(`DELETE FROM competitors WHERE tour_id=$1`, [tourId]);
      }

      const savedCompetitors = [];
      for (const p of participants) {
        const compSize = participant_type === 'team' ? Number(p.comp_size) : 1;

        const { rows: compRows } = await client.query(
          `INSERT INTO competitors (tour_id, comp_name, comp_size)
           VALUES ($1,$2,$3)
           RETURNING *`,
          [tourId, p.comp_name.trim(), compSize]
        );
        const comp = compRows[0];

        if (participant_type === 'team' && Array.isArray(p.members)) {
          const savedMembers = [];
          for (const m of p.members) {
            const { rows: memRows } = await client.query(
              `INSERT INTO teammember (comp_id, mem_name, mem_expe)
               VALUES ($1,$2,$3)
               RETURNING *`,
              [comp.comp_id, m.mem_name.trim(), m.mem_expe || null]
            );
            savedMembers.push(memRows[0]);
          }
          comp.members = savedMembers;
        }

        if (participant_type === 'individual') {
          const { rows: memRows } = await client.query(
            `INSERT INTO teammember (comp_id, mem_name, mem_expe)
             VALUES ($1,$2,$3)
             RETURNING *`,
            [comp.comp_id, p.comp_name.trim(), p.mem_expe || null]
          );
          comp.member = memRows[0];
        }

        savedCompetitors.push(comp);
      }

      await client.query('COMMIT');
      return { tournament: tourRows[0], competitors: savedCompetitors };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  //Step 3

  async updateFormat(tourId, tour_format, organizerId) {
    const { rows } = await pool.query(
      `UPDATE tournament
       SET tour_format=$1
       WHERE tour_id=$2 AND created_by=$3
       RETURNING *`,
      [tour_format, tourId, organizerId]
    );
    return rows[0] || null;
  }

  //Step 4

  async getFullTournament(tourId, organizerId) {
    //Tournament + sport info
    const { rows: tourRows } = await pool.query(
      `SELECT t.*, s.sport_name, s.sport_type, s.sport_banner,
              (SELECT comp_size FROM competitors c WHERE c.tour_id = t.tour_id LIMIT 1) as team_size
       FROM tournament t
       LEFT JOIN sport s ON t.sp_id = s.sport_id
       WHERE t.tour_id=$1 AND t.created_by=$2`,
      [tourId, organizerId]
    );
    if (!tourRows[0]) return null;

    //Competitors
    const { rows: compRows } = await pool.query(
      `SELECT * FROM competitors WHERE tour_id=$1`,
      [tourId]
    );

    //Team members for all competitors
    const compIds = compRows.map(c => c.comp_id);
    let memberRows = [];
    if (compIds.length > 0) {
      const { rows } = await pool.query(
        `SELECT * FROM teammember WHERE comp_id = ANY($1::uuid[])`,
        [compIds]
      );
      memberRows = rows;
    }

    //Attach members to competitors
    const competitors = compRows.map(c => ({
      ...c,
      members: memberRows.filter(m => m.comp_id === c.comp_id),
    }));

    return { ...tourRows[0], competitors };
  }

  async publish(tourId, organizerId) {
    const { rows } = await pool.query(
      `UPDATE tournament
       SET tour_status='ongoing'
       WHERE tour_id=$1 AND created_by=$2 AND COALESCE(tour_status, 'draft') <> 'ongoing'
       RETURNING *`,
      [tourId, organizerId]
    );
    return rows[0] || null;
  }

  async findById(tourId, organizerId) {
    const { rows } = await pool.query(
      `SELECT * FROM tournament WHERE tour_id=$1 AND created_by=$2`,
      [tourId, organizerId]
    );
    return rows[0] || null;
  }

  async listAll(organizerId) {
    const { rows } = await pool.query(
      `SELECT t.*, s.sport_name, s.sport_type, s.sport_banner,
              (SELECT COUNT(*)::int FROM competitors c WHERE c.tour_id = t.tour_id) as competitor_count,
              (SELECT comp_size FROM competitors c WHERE c.tour_id = t.tour_id LIMIT 1) as team_size
       FROM tournament t
       LEFT JOIN sport s ON t.sp_id = s.sport_id
       WHERE t.created_by=$1
       ORDER BY t.tour_startdate DESC NULLS LAST, t.tour_name ASC`,
      [organizerId]
    );
    return rows;
  }

  async listPublic({ sportId } = {}) {
    let query = `
      SELECT t.*, s.sport_name, s.sport_type, s.sport_banner,
             (SELECT COUNT(*)::int FROM competitors c WHERE c.tour_id = t.tour_id) as competitor_count,
             (SELECT comp_size FROM competitors c WHERE c.tour_id = t.tour_id LIMIT 1) as team_size
      FROM tournament t
      LEFT JOIN sport s ON t.sp_id = s.sport_id
      WHERE COALESCE(t.tour_status, 'draft') <> 'draft'
    `;
    const params = [];
    if (sportId) {
      params.push(sportId);
      query += ` AND t.sp_id = $${params.length}`;
    }
    query += ` ORDER BY t.tour_startdate DESC NULLS LAST, t.tour_name ASC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }
}

module.exports = new TournamentRepository();
