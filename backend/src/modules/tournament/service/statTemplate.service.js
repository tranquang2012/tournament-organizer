const repo = require('../repository/statTemplate.repository');
const tourRepo = require('../repository/tournament.repository');
const AppError = require('../../../shared/errors/AppError');
const { VALID_STAT_TYPES } = require('../../../shared/constants/statTypes');

class StatTemplateService {
  async getTemplates(tournamentId) {
    return repo.getTemplates(tournamentId);
  }

  async createTemplate(tournamentId, name, type, organizerId) {
    const tournament = await tourRepo.findById(tournamentId, organizerId);
    if (!tournament) throw new AppError('Tournament not found or access denied.', 404);
    
    // Check if type is valid
    if (!VALID_STAT_TYPES.includes(type)) {
      throw new AppError('Invalid stat type.', 400);
    }
    
    try {
      return await repo.createTemplate(tournamentId, name, type);
    } catch (err) {
      if (err.code === '23505') { // Postgres unique violation
        throw new AppError(`A template with the name "${name}" already exists.`, 409);
      }
      throw err;
    }
  }

  async deleteTemplate(templateId, tournamentId, organizerId) {
    const tournament = await tourRepo.findById(tournamentId, organizerId);
    if (!tournament) throw new AppError('Tournament not found or access denied.', 404);

    const deleted = await repo.deleteTemplate(templateId, tournamentId);
    if (!deleted) throw new AppError('Template not found.', 404);
    return deleted;
  }
}

module.exports = new StatTemplateService();
