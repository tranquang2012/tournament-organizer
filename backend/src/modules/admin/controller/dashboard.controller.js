const service = require('../service/dashboard.service');

class DashboardController {
  async getDashboardStats(req, res, next) {
    try {
      const data = await service.getDashboardStats();
      res.status(200).json({ success: true, data });
    } catch (err) { 
      next(err); 
    }
  }
}

module.exports = new DashboardController();
