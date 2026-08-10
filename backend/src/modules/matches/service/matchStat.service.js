const repo = require('../repository/matchStat.repository');
const tourRepo = require('../../tournament/repository/tournament.repository');
const AppError = require('../../../shared/errors/AppError');
const { VALID_STAT_TYPES } = require('../../../shared/constants/statTypes');

class MatchStatService {
  async _assertAccess(matchId, organizerId) {
    const tournamentId = await repo.getTournamentIdByMatch(matchId);
    if (!tournamentId) throw new AppError('Match not found.', 404);
    
    // Check if organizer owns this tournament
    const tournament = await tourRepo.findById(tournamentId, organizerId);
    if (!tournament) throw new AppError('Access denied.', 403);
  }

  async getStats(matchId) {
    return repo.getStats(matchId);
  }

  async createStat(matchId, name, type, organizerId) {
    await this._assertAccess(matchId, organizerId);

    if (!VALID_STAT_TYPES.includes(type)) {
      throw new AppError('Invalid stat type.', 400);
    }
    
    try {
      return await repo.createStat(matchId, name, type);
    } catch (err) {
      if (err.code === '23505') { // Postgres unique violation
        throw new AppError(`A stat with the name "${name}" already exists for this match.`, 409);
      }
      throw err;
    }
  }

  async updateStat(statId, matchId, body, organizerId) {
    await this._assertAccess(matchId, organizerId);

    const { op, by, value } = body;
    let updated;

    if (op === 'increment' || op === 'decrement') {
      const incrementBy = op === 'increment' ? (by || 1) : -(by || 1);
      if (!Number.isInteger(incrementBy)) {
        throw new AppError('Increment amount must be an integer.', 400);
      }
      updated = await repo.incrementStatValue(statId, matchId, incrementBy);
    } else {
      if (value !== undefined && value !== null && typeof value !== 'string') {
        throw new AppError('Value must be a string.', 400);
      }
      updated = await repo.updateStatValue(statId, matchId, value);
    }

    if (!updated) throw new AppError('Stat not found or operation invalid for stat type.', 404);
    return updated;
  }

  async deleteStat(statId, matchId, organizerId) {
    await this._assertAccess(matchId, organizerId);

    const deleted = await repo.deleteStat(statId, matchId);
    if (!deleted) throw new AppError('Stat not found.', 404);
    return deleted;
  }
}

module.exports = new MatchStatService();
