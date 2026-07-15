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
}

module.exports = new MatchesController();
