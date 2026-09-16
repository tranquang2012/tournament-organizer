const express = require('express');
const authenticateSupabaseUser = require('../../shared/middleware/authenticateSupabaseUser');
const favoriteController = require('./controller/favorite.controller');

const router = express.Router();

router.use(authenticateSupabaseUser);
router.get('/', favoriteController.listFavorites.bind(favoriteController));
router.get('/:tournamentId/status', favoriteController.getFavoriteStatus.bind(favoriteController));
router.post('/:tournamentId', favoriteController.addFavorite.bind(favoriteController));
router.delete('/:tournamentId', favoriteController.removeFavorite.bind(favoriteController));

module.exports = router;
