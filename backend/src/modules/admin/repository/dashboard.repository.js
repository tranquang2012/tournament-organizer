const pool = require('../../../shared/database/pool');

class DashboardRepository {
  async getDashboardStats() {
    const query = `
      WITH tournament_stats AS (
        SELECT 
          COUNT(*) FILTER (WHERE tour_status <> 'draft') as total_tournaments,
          COUNT(*) FILTER (WHERE tour_status IN ('active', 'published')) as active_tournaments,
          COUNT(*) FILTER (WHERE tour_status = 'upcoming' OR (tour_status IN ('active', 'published') AND tour_startdate > NOW())) as upcoming_tournaments,
          COUNT(*) FILTER (WHERE tour_status = 'completed') as completed_tournaments
        FROM tournament
      ),
      participant_stats AS (
        SELECT COUNT(c.comp_id) as total_participants
        FROM competitors c
        JOIN tournament t ON c.tour_id = t.tour_id
        WHERE t.tour_status <> 'draft'
      ),
      user_stats AS (
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role IN ('admin', 'super_admin', 'superadmin')) as admin_users
        FROM user_roles
      ),
      match_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE winning_competitor_id IS NOT NULL OR is_draw = true) as matches_played,
          COUNT(*) FILTER (WHERE status = 'ready') as matches_in_progress
        FROM matches
      ),
      tournaments_by_sport AS (
        SELECT s.sport_name as label, COUNT(t.tour_id) as value
        FROM tournament t
        JOIN sport s ON t.sp_id = s.sport_id
        WHERE t.tour_status <> 'draft'
        GROUP BY s.sport_name
        ORDER BY value DESC
      ),
      tournaments_by_format AS (
        SELECT tour_format as label, COUNT(*) as value
        FROM tournament
        WHERE tour_status <> 'draft'
        GROUP BY tour_format
        ORDER BY value DESC
      ),
      recent_tournaments AS (
        SELECT 
          t.tour_id as id, 
          t.tour_name as name, 
          s.sport_name as sport, 
          t.tour_format as format, 
          t.tour_status as status, 
          t.tour_startdate as date
        FROM tournament t
        LEFT JOIN sport s ON t.sp_id = s.sport_id
        WHERE t.tour_status <> 'draft'
        ORDER BY t.tour_startdate DESC NULLS LAST
        LIMIT 10
      )
      SELECT 
        (SELECT row_to_json(t) FROM tournament_stats t) as t_stats,
        (SELECT row_to_json(p) FROM participant_stats p) as p_stats,
        (SELECT row_to_json(u) FROM user_stats u) as u_stats,
        (SELECT row_to_json(m) FROM match_stats m) as m_stats,
        (SELECT coalesce(json_agg(s), '[]'::json) FROM tournaments_by_sport s) as by_sport,
        (SELECT coalesce(json_agg(f), '[]'::json) FROM tournaments_by_format f) as by_format,
        (SELECT coalesce(json_agg(r), '[]'::json) FROM recent_tournaments r) as recent
    `;

    const { rows } = await pool.query(query);
    const data = rows[0];

    const t_stats = data.t_stats || {};
    const p_stats = data.p_stats || {};
    const u_stats = data.u_stats || {};
    const m_stats = data.m_stats || {};

    return {
      totalTournaments: parseInt(t_stats.total_tournaments || 0, 10),
      activeTournaments: parseInt(t_stats.active_tournaments || 0, 10),
      upcomingTournaments: parseInt(t_stats.upcoming_tournaments || 0, 10),
      completedTournaments: parseInt(t_stats.completed_tournaments || 0, 10),
      
      totalParticipants: parseInt(p_stats.total_participants || 0, 10),
      
      totalUsers: parseInt(u_stats.total_users || 0, 10),
      adminUsers: parseInt(u_stats.admin_users || 0, 10),
      regularUsers: parseInt(u_stats.total_users || 0, 10) - parseInt(u_stats.admin_users || 0, 10),
      
      matchesPlayed: parseInt(m_stats.matches_played || 0, 10),
      matchesInProgress: parseInt(m_stats.matches_in_progress || 0, 10),
      
      tournamentsBySport: data.by_sport || [],
      tournamentsByFormat: data.by_format || [],
      recentTournaments: data.recent || []
    };
  }
}

module.exports = new DashboardRepository();
