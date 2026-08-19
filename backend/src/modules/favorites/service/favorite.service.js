const AppError = require('../../../shared/errors/AppError');
const favoriteRepository = require('../repository/favorite.repository');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const assertTournamentId = (tourId) => {
  if (!tourId || !UUID_PATTERN.test(tourId)) {
    throw new AppError('A valid tournament id is required.', 400);
  }
};

const mapFavoriteTournament = (row) => ({
  favorite_id: row.favorite_id,
  favorited_at: row.favorited_at,
  tournament: {
    tour_id: row.tour_id,
    tour_name: row.tour_name,
    tour_banner: row.tour_banner,
    tour_locat: row.tour_locat,
    tour_descrip: row.tour_descrip,
    tour_startdate: row.tour_startdate,
    tour_enddate: row.tour_enddate,
    tour_status: row.tour_status,
    tour_format: row.tour_format,
    sport_id: row.sport_id,
    sport_name: row.sport_name,
    sport_banner: row.sport_banner,
  },
});

class FavoriteService {
  constructor(repository = favoriteRepository) {
    this.repository = repository;
  }

  async addFavorite(userId, tourId) {
    assertTournamentId(tourId);
    const favorite = await this.repository.addFavorite(userId, tourId);
    if (!favorite) {
      throw new AppError('Tournament not found or is not publicly available.', 404);
    }
    return { is_favorite: true, ...favorite };
  }

  async removeFavorite(userId, tourId) {
    assertTournamentId(tourId);
    const removed = await this.repository.removeFavorite(userId, tourId);
    return { is_favorite: false, removed };
  }

  async getFavoriteStatus(userId, tourId) {
    assertTournamentId(tourId);
    const favorite = await this.repository.getFavorite(userId, tourId);
    return {
      is_favorite: Boolean(favorite),
      favorite_id: favorite?.favorite_id || null,
      favorited_at: favorite?.created_at || null,
    };
  }

  async listFavorites(userId) {
    const favorites = await this.repository.listFavorites(userId);
    return favorites.map(mapFavoriteTournament);
  }
}

const service = new FavoriteService();

module.exports = service;
module.exports.FavoriteService = FavoriteService;
