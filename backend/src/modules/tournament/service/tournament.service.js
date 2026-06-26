const repo = require('../repository/tournament.repository');
const AppError = require('../../../shared/errors/AppError');
const { validateCreateTournamentDto }    = require('../dto/createTournament.dto');
const { validateSportParticipantsDto }   = require('../dto/sportParticipants.dto');
const { validateFormatConfigDto }        = require('../dto/formatConfig.dto');
const { validateUpdateCompetitorDto } = require('../dto/updateComp.dto');

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

    const { data, errors } = validateFormatConfigDto(body, tournament.sp_id);
    if (errors) throw new AppError(errors.join(' | '), 400);

    const updated = await repo.updateFormat(tourId, data.tour_format, organizerId);
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
