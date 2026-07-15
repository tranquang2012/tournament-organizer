const service = require('../service/tournament.service');
const bracketService = require('../service/bracket.service');

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

  async updateMember(req, res, next) {
    try {
      const data = await service.updateMember(req.params.memId, req.body, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async updateCompetitor(req, res, next) {
   try {
    const { id: tourId, compId } = req.params;
     const competitor = await service.updateCompetitor(
       tourId,
       compId,
       req.body,
       req.auth.userId
      );
      res.status(200).json({ success: true, data: competitor });
    } catch (err) {
      next(err);
    }
  }

  async generateBracket(req, res, next) {
    try {
      const result = await bracketService.generateBracket(req.params.id);
      res.status(200).json({ success: true, status: 'READY', totalMatches: result.totalMatches });
    } catch (err) { next(err); }
  }

  async getBracket(req, res, next) {
    try {
      const data = await bracketService.getBracket(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getBrackets(req, res, next) {
    try {
      const data = await bracketService.getBrackets(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async submitRoundScores(req, res, next) {
  try {
    const { id: tourId, matchId } = req.params;
    const { scores } = req.body;

    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'scores must be a non-empty array of { comp_id, score }.',
      });
    }

    const data = await bracketService.submitRoundScores(
      tourId,
      matchId,
      scores,
      req.auth.userId
    );

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
}

module.exports = new TournamentController();
