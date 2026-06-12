const service = require('../service/tournament.service');

class TournamentController {
  //Step 1
  async createGeneralDetails(req, res, next) {
    try {
      const data = await service.createGeneralDetails(req.body, req.auth.userId);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async updateGeneralDetails(req, res, next) {
    try {
      const data = await service.updateGeneralDetails(req.params.id, req.body, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  //Step 2
  async saveSportAndParticipants(req, res, next) {
    try {
      const data = await service.saveSportAndParticipants(req.params.id, req.body, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  //Step 3
  async saveFormatConfig(req, res, next) {
    try {
      const data = await service.saveFormatConfig(req.params.id, req.body, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  //Step 4
  async getReview(req, res, next) {
    try {
      const data = await service.getReviewData(req.params.id, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async publish(req, res, next) {
    try {
      const data = await service.publishTournament(req.params.id, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = new TournamentController();
