const service = require('../service/matchStat.service');

class MatchStatController {
  async getStats(req, res, next) {
    try {
      const data = await service.getStats(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createStat(req, res, next) {
    try {
      const { name, type, comp_id } = req.body;
      const data = await service.createStat(req.params.id, name, type, comp_id, req.auth.userId);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async updateStat(req, res, next) {
    try {
      const { statId } = req.params;
      const data = await service.updateStat(statId, req.params.id, req.body, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async deleteStat(req, res, next) {
    try {
      const { statId } = req.params;
      const data = await service.deleteStat(statId, req.params.id, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = new MatchStatController();
