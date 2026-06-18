const service = require('../service/tournament.service');

class TournamentController {
  //Step 1
  async createGeneralDetails(req, res, next) {
    try {
      const data = await service.createGeneralDetails(req.body, req.auth.userId, req.auth.accessToken);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async updateGeneralDetails(req, res, next) {
    try {
      const data = await service.updateGeneralDetails(req.params.id, req.body, req.auth.userId, req.auth.accessToken);
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

  async listTournaments(req, res, next) {
    try {
      const data = await service.listTournaments(req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async listPublicTournaments(req, res, next) {
    try {
      const { sportId } = req.query;
      const data = await service.listPublicTournaments({ sportId });
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async discardDraft(req, res, next) {
    try {
      const result = await service.discardDraft(req.params.id, req.auth.userId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getParticipants(req, res, next) {
    try {
      const data = await service.getParticipants(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async deleteTournament(req, res, next) {
    try {
      const result = await service.deleteTournament(req.params.id, req.auth.userId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TournamentController();
