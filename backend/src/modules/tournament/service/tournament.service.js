const repo = require('../repository/tournament.repository');
const AppError = require('../../../shared/errors/AppError');
const { validateCreateTournamentDto }    = require('../dto/createTournament.dto');
const { validateSportParticipantsDto }   = require('../dto/sportParticipants.dto');
const { validateFormatConfigDto }        = require('../dto/formatConfig.dto');

class TournamentService {
  //Step 1
  async createGeneralDetails(body, organizerId) {
    const { data, errors } = validateCreateTournamentDto(body);
    if (errors) throw new AppError(errors.join(' | '), 400);
    return repo.create(data, organizerId);
  }

  async updateGeneralDetails(tourId, body, organizerId) {
    await this._assertExists(tourId, organizerId);
    const { data, errors } = validateCreateTournamentDto(body);
    if (errors) throw new AppError(errors.join(' | '), 400);
    const updated = await repo.updateGeneralDetails(tourId, data, organizerId);
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


  async _assertExists(tourId, organizerId) {
    const t = await repo.findById(tourId, organizerId);
    if (!t) throw new AppError('Tournament not found or access denied.', 404);
    return t;
  }
}

module.exports = new TournamentService();