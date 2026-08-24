const favoriteService = require('../service/favorite.service');

class FavoriteController {
  async listFavorites(req, res, next) {
    try {
      const data = await favoriteService.listFavorites(req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getFavoriteStatus(req, res, next) {
    try {
      const data = await favoriteService.getFavoriteStatus(
        req.auth.userId,
        req.params.tournamentId
      );
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async addFavorite(req, res, next) {
    try {
      const data = await favoriteService.addFavorite(
        req.auth.userId,
        req.params.tournamentId
      );
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async removeFavorite(req, res, next) {
    try {
      const data = await favoriteService.removeFavorite(
        req.auth.userId,
        req.params.tournamentId
      );
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }
}

module.exports = new FavoriteController();
