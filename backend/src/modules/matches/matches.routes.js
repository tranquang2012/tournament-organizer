const express = require('express');
const router = express.Router();
const ctrl = require('./controller/matches.controller');
const auth = require('../../shared/middleware/authenticateSupabaseUser');
const requireAdminUser = require('../../shared/middleware/requireAdminUser');

// Public route to get all scheduled matches for calendar
router.get('/calendar', ctrl.getScheduledMatches.bind(ctrl));

// Public route to get recent matches for a sport
router.get('/public', ctrl.getPublicMatchesBySport.bind(ctrl));

// Public route to view match details
router.get('/:matchId', ctrl.getMatch.bind(ctrl));

// Admin-only routes to update scores and results
router.patch('/:matchId', auth, requireAdminUser, ctrl.updateMatch.bind(ctrl));

// schedule a match
router.patch('/:matchId/schedule', auth, requireAdminUser, ctrl.scheduleMatch.bind(ctrl));

const statCtrl = require('./controller/matchStat.controller');

// Match Stats
router.get('/:id/stats', statCtrl.getStats.bind(statCtrl));
router.post('/:id/stats', auth, requireAdminUser, statCtrl.createStat.bind(statCtrl));
router.patch('/:id/stats/:statId', auth, requireAdminUser, statCtrl.updateStat.bind(statCtrl));
router.delete('/:id/stats/:statId', auth, requireAdminUser, statCtrl.deleteStat.bind(statCtrl));

// Start, Pause, Resume match
router.patch('/:matchId/start',    auth, requireAdminUser, ctrl.startMatch.bind(ctrl));
router.patch('/:matchId/pause',    auth, requireAdminUser, ctrl.pauseMatch.bind(ctrl));
router.patch('/:matchId/resume',   auth, requireAdminUser, ctrl.resumeMatch.bind(ctrl));

module.exports = router;
