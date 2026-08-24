const pool = require('../../../shared/database/pool');

class FavoriteRepository {
  async addFavorite(userId, tourId, executor = pool) {
    const { rows } = await executor.query(
      `INSERT INTO public.tournament_favorites (user_id, tour_id)
       SELECT $1, t.tour_id
       FROM public.tournament t
       WHERE t.tour_id = $2
         AND LOWER(COALESCE(t.tour_status, 'draft')) <> 'draft'
       ON CONFLICT (user_id, tour_id)
       DO UPDATE SET updated_at = NOW()
       RETURNING favorite_id, user_id, tour_id, created_at, updated_at`,
      [userId, tourId]
    );
    return rows[0] || null;
  }

  async removeFavorite(userId, tourId, executor = pool) {
    const result = await executor.query(
      `DELETE FROM public.tournament_favorites
       WHERE user_id = $1 AND tour_id = $2`,
      [userId, tourId]
    );
    return result.rowCount > 0;
  }

  async getFavorite(userId, tourId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT favorite_id, user_id, tour_id, created_at, updated_at
       FROM public.tournament_favorites
       WHERE user_id = $1 AND tour_id = $2`,
      [userId, tourId]
    );
    return rows[0] || null;
  }

  async listFavorites(userId, executor = pool) {
    const { rows } = await executor.query(
       `SELECT tf.favorite_id, tf.created_at AS favorited_at,
              t.tour_id, t.tour_name, t.tour_banner, t.tour_locat,
              t.tour_descrip, t.tour_startdate::text AS tour_startdate,
              t.tour_enddate::text AS tour_enddate,
              t.tour_status, t.tour_format,
              s.sport_id, s.sport_name, s.sport_banner
       FROM public.tournament_favorites tf
       JOIN public.tournament t ON t.tour_id = tf.tour_id
       LEFT JOIN public.sport s ON s.sport_id = t.sp_id
       WHERE tf.user_id = $1
       ORDER BY t.tour_startdate ASC NULLS LAST, t.tour_name ASC`,
      [userId]
    );
    return rows;
  }

  async claimDueReminders({
    today,
    daysBefore,
    batchSize,
    staleClaimMinutes,
  }, executor = pool) {
    const { rows } = await executor.query(
      `WITH due AS (
         SELECT tf.favorite_id, t.tour_startdate
         FROM public.tournament_favorites tf
         JOIN public.tournament t ON t.tour_id = tf.tour_id
         JOIN public.user_roles ur ON ur.id = tf.user_id
         WHERE t.tour_startdate = $1::date + $2::integer
           AND LOWER(COALESCE(t.tour_status, 'draft'))
               NOT IN ('draft', 'completed', 'cancelled', 'canceled', 'archived')
           AND NULLIF(TRIM(ur.email), '') IS NOT NULL
           AND COALESCE(ur.is_disable, false) = false
           AND tf.reminder_sent_for_startdate IS DISTINCT FROM t.tour_startdate
           AND (
             tf.reminder_claimed_for_startdate IS DISTINCT FROM t.tour_startdate
             OR tf.reminder_claimed_at IS NULL
             OR tf.reminder_claimed_at < NOW() - ($4::integer * INTERVAL '1 minute')
           )
         ORDER BY t.tour_startdate, tf.created_at
         LIMIT $3
         FOR UPDATE OF tf SKIP LOCKED
       ), claimed AS (
         UPDATE public.tournament_favorites tf
         SET reminder_claimed_for_startdate = due.tour_startdate,
             reminder_claimed_at = NOW(),
             updated_at = NOW()
         FROM due
         WHERE tf.favorite_id = due.favorite_id
         RETURNING tf.favorite_id, tf.user_id, tf.tour_id,
                   tf.reminder_claimed_for_startdate
       )
       SELECT c.favorite_id, c.user_id, c.tour_id,
              ur.email, ur.full_name,
              t.tour_name, t.tour_startdate::text AS tour_startdate,
              t.tour_enddate::text AS tour_enddate,
              t.tour_locat, t.tour_descrip, s.sport_name
       FROM claimed c
       JOIN public.user_roles ur ON ur.id = c.user_id
       JOIN public.tournament t ON t.tour_id = c.tour_id
       LEFT JOIN public.sport s ON s.sport_id = t.sp_id
       ORDER BY t.tour_startdate, c.favorite_id`,
      [today, daysBefore, batchSize, staleClaimMinutes]
    );
    return rows;
  }

  async markReminderSent(favoriteId, startDate, executor = pool) {
    const result = await executor.query(
      `UPDATE public.tournament_favorites
       SET reminder_sent_for_startdate = $2::date,
           reminder_sent_at = NOW(),
           reminder_claimed_for_startdate = NULL,
           reminder_claimed_at = NULL,
           updated_at = NOW()
       WHERE favorite_id = $1
         AND reminder_claimed_for_startdate = $2::date`,
      [favoriteId, startDate]
    );
    return result.rowCount > 0;
  }

  async releaseReminderClaim(favoriteId, startDate, executor = pool) {
    await executor.query(
      `UPDATE public.tournament_favorites
       SET reminder_claimed_for_startdate = NULL,
           reminder_claimed_at = NULL,
           updated_at = NOW()
       WHERE favorite_id = $1
         AND reminder_claimed_for_startdate = $2::date`,
      [favoriteId, startDate]
    );
  }
}

module.exports = new FavoriteRepository();
