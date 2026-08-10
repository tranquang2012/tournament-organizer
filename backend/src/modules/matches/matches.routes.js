const express = require('express');
const router = express.Router();
const ctrl = require('./controller/matches.controller');
const auth = require('../../shared/middleware/authenticateSupabaseUser');
const requireAdminUser = require('../../shared/middleware/requireAdminUser');

// Public route to view match details
router.get('/:matchId', ctrl.getMatch.bind(ctrl));

// Admin-only routes to update scores and results
router.put('/:matchId', auth, requireAdminUser, ctrl.updateMatch.bind(ctrl));
router.patch('/:matchId', auth, requireAdminUser, ctrl.updateMatch.bind(ctrl));

// Support contract-defined result endpoint for compatibility
router.put('/:matchId/result', auth, requireAdminUser, ctrl.updateMatch.bind(ctrl));

// schedule a match
router.patch('/:matchId/schedule', auth, requireAdminUser, ctrl.scheduleMatch.bind(ctrl));

const statCtrl = require('./controller/matchStat.controller');

// Match Stats
router.get('/:id/stats', statCtrl.getStats.bind(statCtrl));
router.post('/:id/stats', auth, requireAdminUser, statCtrl.createStat.bind(statCtrl));
router.patch('/:id/stats/:statId', auth, requireAdminUser, statCtrl.updateStat.bind(statCtrl));
router.delete('/:id/stats/:statId', auth, requireAdminUser, statCtrl.deleteStat.bind(statCtrl));

module.exports = router;
