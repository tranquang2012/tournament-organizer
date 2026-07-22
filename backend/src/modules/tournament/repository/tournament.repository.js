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
       WHERE tour_id=$7 AND (created_by=$8 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $8 AND role IN ('superadmin', 'super_admin')))
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
         WHERE tour_id=$2 AND (created_by=$3 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $3 AND role IN ('superadmin', 'super_admin')))
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

  async updateFormat(tourId, data, organizerId) {
    const { tour_format, group_count, advance_per_group, first_stage_format, second_stage_format } = data;
    const { rows } = await pool.query(
      `UPDATE tournament
       SET tour_format=$1, group_count=$2, advance_per_group=$3, first_stage_format=$6, second_stage_format=$7
       WHERE tour_id=$4 AND (created_by=$5 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $5 AND role IN ('superadmin', 'super_admin')))
       RETURNING *`,
      [tour_format, group_count, advance_per_group, tourId, organizerId, first_stage_format, second_stage_format]
    );
    return rows[0] || null;
  }

  //Step 4

  async getFullTournament(tourId, organizerId) {
    //Tournament + sport info
    const { rows: tourRows } = await pool.query(
      `SELECT t.*, s.sport_name, s.sport_type, s.sport_banner, s.sport_format,
              (SELECT comp_size FROM competitors c WHERE c.tour_id = t.tour_id LIMIT 1) as team_size
       FROM tournament t
       LEFT JOIN sport s ON t.sp_id = s.sport_id
       WHERE t.tour_id=$1 AND (t.created_by=$2 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin')))`,
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
       WHERE tour_id=$1 AND (created_by=$2 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin'))) AND COALESCE(tour_status, 'draft') <> 'ongoing'
       RETURNING *`,
      [tourId, organizerId]
    );
    return rows[0] || null;
  }

  async findById(tourId, organizerId) {
    const { rows } = await pool.query(
      `SELECT t.*, s.sport_format
       FROM tournament t
       LEFT JOIN sport s ON t.sp_id = s.sport_id
       WHERE t.tour_id=$1 AND (t.created_by=$2 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin')))`,
      [tourId, organizerId]
    );
    return rows[0] || null;
  }

  async listAll(organizerId) {
    const { rows } = await pool.query(
      `SELECT t.*, s.sport_name, s.sport_type, s.sport_banner, s.sport_format,
              (SELECT COUNT(*)::int FROM competitors c WHERE c.tour_id = t.tour_id) as competitor_count,
              (SELECT comp_size FROM competitors c WHERE c.tour_id = t.tour_id LIMIT 1) as team_size
       FROM tournament t
       LEFT JOIN sport s ON t.sp_id = s.sport_id
       WHERE t.created_by=$1 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $1 AND role IN ('superadmin', 'super_admin'))
       ORDER BY t.tour_startdate DESC NULLS LAST, t.tour_name ASC`,
      [organizerId]
    );
    return rows;
  }

  async listPublic({ sportId } = {}) {
    let query = `
      SELECT t.*, s.sport_name, s.sport_type, s.sport_banner, s.sport_format,
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

  async getPublic(tourId) {
    const query = `
      SELECT t.*, s.sport_name, s.sport_type, s.sport_banner,
             (SELECT COUNT(*)::int FROM competitors c WHERE c.tour_id = t.tour_id) as competitor_count,
             (SELECT comp_size FROM competitors c WHERE c.tour_id = t.tour_id LIMIT 1) as team_size
      FROM tournament t
      LEFT JOIN sport s ON t.sp_id = s.sport_id
      WHERE t.tour_id = $1 AND COALESCE(t.tour_status, 'draft') <> 'draft'
    `;
    const { rows } = await pool.query(query, [tourId]);
    return rows[0] || null;
  }


  async deleteDraft(tourId, organizerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    //1.Verify ownership and draft status before touching anything
    const { rows: tourRows } = await client.query(
      `SELECT tour_id, tour_status FROM tournament
       WHERE tour_id = $1 AND (created_by = $2 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin')))`,
      [tourId, organizerId]
    );

    if (!tourRows[0]) {
      await client.query('ROLLBACK');
      return { deleted: false, reason: 'not_found' };
    }

    if (tourRows[0].tour_status === 'published') {
      await client.query('ROLLBACK');
      return { deleted: false, reason: 'already_published' };
    }

    //2.Delete team members first (FK constraint: teammember → competitors)
    const { rows: compRows } = await client.query(
      `SELECT comp_id FROM competitors WHERE tour_id = $1`,
      [tourId]
    );

    if (compRows.length > 0) {
      const compIds = compRows.map(r => r.comp_id);
      await client.query(
        `DELETE FROM teammember WHERE comp_id = ANY($1::uuid[])`,
        [compIds]
      );
    }

    //3.Delete competitors
    await client.query(
      `DELETE FROM competitors WHERE tour_id = $1`,
      [tourId]
    );

    //4.Delete the tournament itself
    await client.query(
      `DELETE FROM tournament WHERE tour_id = $1 AND (created_by = $2 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin')))`,
      [tourId, organizerId]
    );

    await client.query('COMMIT');
    return { deleted: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

  async getParticipants(tourId) {
    const { rows: competitors } = await pool.query(
      `SELECT comp_id, comp_name, comp_size, comp_logo FROM competitors WHERE tour_id = $1`,
      [tourId]
    );

    if (competitors.length === 0) {
      return [];
    }

    const compIds = competitors.map(c => c.comp_id);
    const { rows: teamMembers } = await pool.query(
      `SELECT mem_id, comp_id, mem_name, mem_expe FROM teammember WHERE comp_id = ANY($1::uuid[])`,
      [compIds]
    );

    return competitors.map(comp => {
      const members = teamMembers.filter(m => m.comp_id === comp.comp_id);
      
      if (comp.comp_size === 1) {
        const primaryMember = members[0] || {};
        return {
          type: "individual",
          id: comp.comp_id,
          name: primaryMember.mem_name || comp.comp_name || "Unknown",
          experience: primaryMember.mem_expe || "Beginner",
          logo: comp.comp_logo
        };
      } else {
        return {
          type: "team",
          id: comp.comp_id,
          name: comp.comp_name || "Unnamed Team",
          logo: comp.comp_logo,
          members: members.map(m => ({
            id: m.mem_id,
            name: m.mem_name,
            experience: m.mem_expe || "Beginner"
          }))
        };
      }
    });
  }

  async deleteTournament(tourId, organizerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      //1.Verify ownership
      const { rows: tourRows } = await client.query(
        `SELECT tour_id FROM tournament
         WHERE tour_id = $1 AND (created_by = $2 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin')))`,
        [tourId, organizerId]
      );

      if (!tourRows[0]) {
        await client.query('ROLLBACK');
        return { deleted: false, reason: 'not_found' };
      }

      //2.Delete team members first 
      const { rows: compRows } = await client.query(
        `SELECT comp_id FROM competitors WHERE tour_id = $1`,
        [tourId]
      );

      if (compRows.length > 0) {
        const compIds = compRows.map(r => r.comp_id);
        await client.query(
          `DELETE FROM teammember WHERE comp_id = ANY($1::uuid[])`,
          [compIds]
        );
      }

      //3.Delete competitors
      await client.query(
        `DELETE FROM competitors WHERE tour_id = $1`,
        [tourId]
      );

      //4.Delete the tournament
      await client.query(
        `DELETE FROM tournament WHERE tour_id = $1 AND (created_by = $2 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin')))`,
        [tourId, organizerId]
      );

      await client.query('COMMIT');
      return { deleted: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getMemberOwnership(memId, organizerId) {
    const { rows } = await pool.query(
      `SELECT c.tour_id, c.comp_id, c.comp_size, t.created_by,
              EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin')) as is_super_admin
       FROM teammember m
       JOIN competitors c ON m.comp_id = c.comp_id
       JOIN tournament t ON c.tour_id = t.tour_id
       WHERE m.mem_id = $1`,
      [memId, organizerId]
    );
    return rows[0] || null;
  }

  async updateMember(memId, { mem_name, mem_expe, comp_id }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `UPDATE teammember 
         SET mem_name = COALESCE($1, mem_name), 
             mem_expe = COALESCE($2, mem_expe),
             comp_id = COALESCE($3, comp_id)
         WHERE mem_id = $4
         RETURNING *`,
        [mem_name, mem_expe, comp_id, memId]
      );
      const updatedMember = rows[0];

      if (updatedMember) {
        const { rows: compRows } = await client.query(
          `SELECT comp_size FROM competitors WHERE comp_id = $1`,
          [updatedMember.comp_id]
        );
        const comp = compRows[0];
        if (comp && comp.comp_size === 1 && mem_name) {
          await client.query(
            `UPDATE competitors
             SET comp_name = $1
             WHERE comp_id = $2`,
            [mem_name, updatedMember.comp_id]
          );
        }
      }

      await client.query('COMMIT');
      return updatedMember;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateCompetitor(compId, tourId, organizerId, data) {
  //verify the tournament belongs to this organizer
    const { rows: tourRows } = await pool.query(
      `SELECT tour_id FROM tournament
       WHERE tour_id = $1 AND (created_by = $2 OR EXISTS (SELECT 1 FROM public.user_roles WHERE id = $2 AND role IN ('superadmin', 'super_admin')))`,
      [tourId, organizerId]
    );

    if (!tourRows[0]) return { updated: false, reason: 'tournament_not_found' };

  //Verify the competitor belongs to this tournament
   const { rows: compRows } = await pool.query(
      `SELECT comp_id FROM competitors
      WHERE comp_id = $1 AND tour_id = $2`,
     [compId, tourId]
    );

   if (!compRows[0]) return { updated: false, reason: 'competitor_not_found' };

   const fields = [];
   const values = [];
   let idx = 1;

   if (data.comp_name !== undefined) {
      fields.push(`comp_name = $${idx++}`);
      values.push(data.comp_name);
   }
   if (data.comp_logo !== undefined) {
     fields.push(`comp_logo = $${idx++}`);
     values.push(data.comp_logo);
   }

   values.push(compId);

   const { rows } = await pool.query(
     `UPDATE competitors
      SET ${fields.join(', ')}
      WHERE comp_id = $${idx}
      RETURNING *`,
     values
   );

   return { updated: true, competitor: rows[0] };
  }
}

module.exports = new TournamentRepository();
