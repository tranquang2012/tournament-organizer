const service = require('../service/matches.service');

class MatchesController {
  async getMatch(req, res, next) {
    try {
      const { matchId } = req.params;
      const data = await service.getMatch(matchId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async updateMatch(req, res, next) {
    try {
      const { matchId } = req.params;
      const data = await service.updateMatch(matchId, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async scheduleMatch(req, res, next) {
    try {
      const { matchId } = req.params;
      const data = await service.scheduleMatch(matchId, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
  async startMatch(req, res, next) {
    try {
      const { matchId } = req.params;
      const data = await service.startMatch(matchId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getScheduledMatches(req, res, next) {
    try {
      const data = await service.getScheduledMatches();
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async pauseMatch(req, res, next) {
    try {
      const { matchId } = req.params;
      const data = await service.pauseMatch(matchId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async resumeMatch(req, res, next) {
    try {
      const { matchId } = req.params;
      const data = await service.resumeMatch(matchId, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getPublicMatchesBySport(req, res, next) {
    try {
      const { sportId } = req.query;
      const data = await service.getPublicMatchesBySport(sportId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = new MatchesController();
