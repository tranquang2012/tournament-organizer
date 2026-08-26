const repo = require('../repository/tournament.repository');
const AppError = require('../../../shared/errors/AppError');
const pool = require('../../../shared/database/pool');
const { validateCreateTournamentDto }    = require('../dto/createTournament.dto');
const { validateSportParticipantsDto }   = require('../dto/sportParticipants.dto');
const { validateFormatConfigDto }        = require('../dto/formatConfig.dto');
const { validateUpdateCompetitorDto } = require('../dto/updateComp.dto');
const { validatePauseDto, validateResumeDto } = require('../dto/pauseTournament.dto');
const matchesRepository = require('../../matches/repository/matches.repository');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toUtcCalendarDate = (value) => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const toDateOnlyString = (value) => (
  toUtcCalendarDate(value).toISOString().slice(0, 10)
);

const SUPPORTED_BANNER_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const parseBannerUpload = (bannerDataUrl) => {
  const match = bannerDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new AppError("Banner data URL must be a base64 encoded image.", 400);
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
};

const uploadBannerToSupabase = async ({ tourId, organizerId, accessToken, contentType, buffer }) => {
  const bucket = process.env.SUPABASE_BANNER_BUCKET || "tournament-banners";
  const extension = SUPPORTED_BANNER_TYPES.get(contentType) || "png";
  const objectPath = `${tourId}_${Date.now()}.${extension}`;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Supabase banner upload failed:", errorText);
    throw new AppError(`Failed to upload tournament banner. Storage responded with ${response.status}.`, 502);
  }

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}`;
};

class TournamentService {
  //Step 1
  async createGeneralDetails(body, organizerId, accessToken) {
    const { data, errors } = validateCreateTournamentDto(body);
    if (errors) throw new AppError(errors.join(' | '), 400);
    
    // Create first to get the tour_id
    const tournament = await repo.create({ ...data, tour_banner: null }, organizerId);
    
    if (data.tour_banner && data.tour_banner.startsWith("data:")) {
      try {
        const { contentType, buffer } = parseBannerUpload(data.tour_banner);
        const publicUrl = await uploadBannerToSupabase({
          tourId: tournament.tour_id,
          organizerId,
          accessToken,
          contentType,
          buffer
        });
        const updated = await repo.updateGeneralDetails(tournament.tour_id, { ...data, tour_banner: publicUrl }, organizerId);
        return updated;
      } catch (uploadError) {
        console.error("Banner upload failed during create:", uploadError);
        throw uploadError;
      }
    } else if (data.tour_banner) {
      const updated = await repo.updateGeneralDetails(tournament.tour_id, { ...data, tour_banner: data.tour_banner }, organizerId);
      return updated;
    }
    
    return tournament;
  }

  async updateGeneralDetails(tourId, body, organizerId, accessToken) {
    await this._assertExists(tourId, organizerId);
    const { data, errors } = validateCreateTournamentDto(body);
    if (errors) throw new AppError(errors.join(' | '), 400);

    let bannerUrl = data.tour_banner;
    if (data.tour_banner && data.tour_banner.startsWith("data:")) {
      const { contentType, buffer } = parseBannerUpload(data.tour_banner);
      bannerUrl = await uploadBannerToSupabase({
        tourId,
        organizerId,
        accessToken,
        contentType,
        buffer
      });
    }

    const updated = await repo.updateGeneralDetails(tourId, { ...data, tour_banner: bannerUrl }, organizerId);
    if (!updated) throw new AppError('Update failed.', 500);
    return updated;
  }

  //Step 2
  async saveSportAndParticipants(tourId, body, organizerId) {
    await this._assertExists(tourId, organizerId);
    const { data, errors } = validateSportParticipantsDto(body);
    if (errors) throw new AppError(errors.join(' | '), 400);
    return repo.saveSportAndParticipants(tourId, data, organizerId);
  }

  //Step 3
  async saveFormatConfig(tourId, body, organizerId) {
    // Fetch current tournament to get its sp_id for format validation
    const tournament = await this._assertExists(tourId, organizerId);
    if (!tournament.sp_id) {
      throw new AppError('Sport must be selected in Step 2 before configuring format.', 400);
    }

    const { rows: competitorRows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM competitors WHERE tour_id = $1`,
      [tourId]
    );
    const participantCount = competitorRows[0]?.count ?? 0;

    const { data, errors } = validateFormatConfigDto(
      { ...body, sport_format: tournament.sport_format },
      tournament.sp_id,
      participantCount
    );
    if (errors) throw new AppError(errors.join(' | '), 400);

    const updated = await repo.updateFormat(tourId, data, organizerId);
    if (!updated) throw new AppError('Update failed.', 500);
    return updated;
  }

  //Step 4
  async getReviewData(tourId, organizerId) {
    const tournament = await repo.getFullTournament(tourId, organizerId);
    if (!tournament) throw new AppError('Tournament not found.', 404);
    delete tournament.competitors;
    return tournament;
  }

  async publishTournament(tourId, organizerId) {
    const tournament = await repo.getFullTournament(tourId, organizerId);
    if (!tournament) throw new AppError('Tournament not found.', 404);
    if (!tournament.sp_id)      throw new AppError('Sport must be selected before publishing.', 400);
    if (!tournament.tour_format) throw new AppError('Format must be configured before publishing.', 400);
    if (!tournament.competitors?.length) {
      throw new AppError('At least one participant is required before publishing.', 400);
    }
    const published = await repo.publish(tourId, organizerId);
    if (!published) throw new AppError('Tournament is already published or not found.', 400);
    return published;
  }

  async listTournaments(organizerId) {
    return repo.listAll(organizerId);
  }

  async listPublicTournaments({ sportId } = {}) {
    return repo.listPublic({ sportId });
  }

  async getPublicTournament(tourId) {
    const tournament = await repo.getPublic(tourId);
    if (!tournament) throw new AppError('Tournament not found.', 404);
    return tournament;
  }


  async getParticipants(tourId) {
    const data = await repo.getParticipants(tourId);
    return data;
  }


  async _assertExists(tourId, organizerId) {
    const t = await repo.findById(tourId, organizerId);
    if (!t) throw new AppError('Tournament not found or access denied.', 404);
    return t;
  }

  async discardDraft(tourId, organizerId) {
    const result = await repo.deleteDraft(tourId, organizerId);

    if (!result.deleted) {
      if (result.reason === 'not_found') {
        throw new AppError('Tournament not found or access denied.', 404);
      }
      if (result.reason === 'already_published') {
        throw new AppError('Published tournaments cannot be deleted this way.', 400);
      }
    }

    return { message: 'Tournament draft discarded successfully.' };
  }

  async deleteTournament(tourId, organizerId) {
    const result = await repo.deleteTournament(tourId, organizerId);
    if (!result.deleted) {
      if (result.reason === 'not_found') {
        throw new AppError('Tournament not found or access denied.', 404);
      }
    }
    return { message: 'Tournament deleted successfully.' };
  }

  async pauseTournament(tourId, body, organizerId) {
  //Validate pause_date input
  const { data, errors } = validatePauseDto(body);
  if (errors) throw new AppError(errors.join(' | '), 400);

  //Fetch tournament timing info
  const tournament = await repo.getTournamentTiming(tourId, organizerId);
  if (!tournament) throw new AppError('Tournament not found or access denied.', 404);

  //only ongoing tournaments can be paused
  if (tournament.tour_status === 'paused') {
    throw new AppError('Tournament is already paused.', 400);
  }
  if (tournament.tour_status !== 'ongoing') {
    throw new AppError(
      `Only ongoing tournaments can be paused. Current status: '${tournament.tour_status}'.`,
      400
    );
  }

  //pause_date must be within the tournament window
  const pauseDate = toUtcCalendarDate(data.pause_date);
  const startDate = toUtcCalendarDate(tournament.tour_startdate);
  const endDate   = toUtcCalendarDate(tournament.tour_enddate);

  if (pauseDate < startDate) {
    throw new AppError(
      `pause_date (${pauseDate.toDateString()}) cannot be before the tournament start date (${startDate.toDateString()}).`,
      400
    );
  }
  if (pauseDate >= endDate) {
    throw new AppError(
      `pause_date (${pauseDate.toDateString()}) must be before the tournament end date (${endDate.toDateString()}).`,
      400
    );
  }

  //Pause tournament + all active matches in one transaction
  const client = await pool.connect();
  let updated;
  let pausedMatches = [];

  try {
    await client.query('BEGIN');

    //Pause the tournament
    updated = await repo.pauseTournament(tourId, data.pause_date, organizerId, client);
    if (!updated) throw new AppError('Failed to pause tournament.', 500);

    //Pause all ready/waiting/running matches in this tournament
    pausedMatches = await matchesRepository.pauseAllMatchesByTournament(
      tourId,
      data.pause_date,
      client
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return {
    tour_id:         updated.tour_id,
    tour_status:     updated.tour_status,
    tour_startdate:  updated.tour_startdate,
    tour_enddate:    updated.tour_enddate,
    tour_pausedate:  updated.tour_pausedate,
    matches_paused:  pausedMatches.length,
    paused_matches:  pausedMatches.map(m => ({
      match_id:        String(m.match_id),
      status:          m.status,
      scheduled_start: m.scheduled_start,
      scheduled_end:   m.scheduled_end,
      paused_at:       m.tour_pausedate,
    })),
    message: `Tournament paused on ${data.pause_date}. ${pausedMatches.length} match(es) also paused.`,
  };
}

async resumeTournament(tourId, body, organizerId) {
  //Validate resume_date input
  const { data, errors } = validateResumeDto(body);
  if (errors) throw new AppError(errors.join(' | '), 400);

  //Fetch tournament timing info
  const tournament = await repo.getTournamentTiming(tourId, organizerId);
  if (!tournament) throw new AppError('Tournament not found or access denied.', 404);

  //only paused tournaments can be resumed
  if (tournament.tour_status === 'ongoing') {
    throw new AppError('Tournament is already running, no need to resume.', 400);
  }
  if (tournament.tour_status !== 'paused') {
    throw new AppError(
      `Only paused tournaments can be resumed. Current status: '${tournament.tour_status}'.`,
      400
    );
  }

  //resume_date must be after pause_date
  const resumeDate = toUtcCalendarDate(data.resume_date);
  const pauseDate  = toUtcCalendarDate(tournament.tour_pausedate);
  const endDate    = toUtcCalendarDate(tournament.tour_enddate);

  if (resumeDate <= pauseDate) {
    throw new AppError(
      `resume_date (${resumeDate.toDateString()}) must be after the pause date (${pauseDate.toDateString()}).`,
      400
    );
  }

  //Calculate days paused and new tournament end date

  const daysPaused = (resumeDate - pauseDate) / MS_PER_DAY;
  const newEndDate = new Date(endDate.getTime() + daysPaused * MS_PER_DAY);
  const newEndDateString = newEndDate.toISOString().slice(0, 10);

  //Resume tournament + shift all match schedules in one transaction
  const client = await pool.connect();
  let updated;
  let resumedMatches = [];

  try {
    await client.query('BEGIN');

    //Resume tournament with new end date
    updated = await repo.resumeTournament(
      tourId,
      newEndDateString,
      organizerId,
      client
    );
    if (!updated) throw new AppError('Failed to resume tournament.', 500);

    //Resume all paused matches + shift their scheduled_start and scheduled_end forward
    resumedMatches = await matchesRepository.resumeAndShiftAllMatchesByTournament(
      tourId,
      daysPaused,
      client
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return {
    tour_id:               updated.tour_id,
    tour_status:           updated.tour_status,
    tour_startdate:        updated.tour_startdate,
    original_enddate:      toDateOnlyString(endDate),
    new_enddate:           updated.tour_enddate,
    tour_pausedate:        null,
    days_paused:           daysPaused,
    matches_rescheduled:   resumedMatches.length,
    rescheduled_matches:   resumedMatches.map(m => ({
      match_id:        String(m.match_id),
      status:          m.status,
      scheduled_start: m.scheduled_start,
      scheduled_end:   m.scheduled_end,
    })),
    message: `Tournament resumed. End date extended by ${daysPaused} day(s) from ${toDateOnlyString(endDate)} to ${newEndDateString}. ${resumedMatches.length} match(es) rescheduled.`,
  };
}

  async updateMember(memId, body, organizerId) {
    const ownership = await repo.getMemberOwnership(memId, organizerId);
    if (!ownership) {
      throw new AppError('Member not found.', 404);
    }
    if (ownership.created_by !== organizerId && !ownership.is_super_admin) {
      throw new AppError('Access denied.', 403);
    }
    const data = await repo.updateMember(memId, body);
    return data;
  }

  async updateCompetitor(tourId, compId, body, organizerId) {
  //Validate input
    const { data, errors } = validateUpdateCompetitorDto(body);
    if (errors) throw new AppError(errors.join(' | '), 400);

    const result = await repo.updateCompetitor(compId, tourId, organizerId, data);

   if (!result.updated) {
      if (result.reason === 'tournament_not_found') {
       throw new AppError('Tournament not found or access denied.', 404);
     }
     if (result.reason === 'competitor_not_found') {
        throw new AppError('Competitor not found in this tournament.', 404);
      }
    }

   return result.competitor;
  }
}

module.exports = new TournamentService();
