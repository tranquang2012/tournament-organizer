const express = require('express');
const router = express.Router();
const ctrl = require('./controller/tournament.controller');
const statTemplateCtrl = require('./controller/statTemplate.controller');
const auth = require('../../shared/middleware/authenticateSupabaseUser');
const requireAdminUser = require('../../shared/middleware/requireAdminUser');
const { SPORT_RULES } = require('./config/sportRules.config');

router.get('/sport-rules', (req, res) => {
  res.json({ success: true, data: SPORT_RULES });
});

router.get('/public', ctrl.listPublicTournaments.bind(ctrl));
router.get('/:id/public', ctrl.getPublicTournament.bind(ctrl));
router.get('/:id/participants', ctrl.getParticipants.bind(ctrl));
router.get('/:id/matches', ctrl.getMatches.bind(ctrl));
router.get('/:id/stages', ctrl.getStages.bind(ctrl));
router.get('/:id/rankings', ctrl.getRankings.bind(ctrl));


router.use(auth, requireAdminUser);

router.get('/',                               ctrl.listTournaments.bind(ctrl));

//Step 1
router.post('/',                              ctrl.createGeneralDetails.bind(ctrl));
router.patch('/:id/general-details',          ctrl.updateGeneralDetails.bind(ctrl));

//Step 2
router.patch('/:id/sport-participants',       ctrl.saveSportAndParticipants.bind(ctrl));

//Step 3
router.patch('/:id/format-config',            ctrl.saveFormatConfig.bind(ctrl));

//Step 4
router.get('/:id/review',                     ctrl.getReview.bind(ctrl));
router.patch('/:id/publish',                   ctrl.publish.bind(ctrl));

//Discard Draft When Leave Page
router.delete('/:id/discard', ctrl.discardDraft.bind(ctrl));

//Delete Tournament Cascade
router.delete('/:id', ctrl.deleteTournament.bind(ctrl));

//Update Participant Member Details (Name, Experience, Team/Competitor)
router.patch('/participants/members/:memId', ctrl.updateMember.bind(ctrl));

// Edit a competitor's name and/or logo
router.patch('/:id/competitors/:compId', ctrl.updateCompetitor.bind(ctrl));

// Lock structure and generate bracket/matches
router.post('/:id/generate-bracket', ctrl.generateBracket.bind(ctrl));

// Submit scores for a round_scoring round
router.post('/:id/bracket/rounds/:matchId/scores', ctrl.submitRoundScores.bind(ctrl));

// Stat Templates
router.get('/:id/stat-templates', statTemplateCtrl.getTemplates.bind(statTemplateCtrl));
router.post('/:id/stat-templates', statTemplateCtrl.createTemplate.bind(statTemplateCtrl));
router.delete('/:id/stat-templates/:templateId', statTemplateCtrl.deleteTemplate.bind(statTemplateCtrl));

// Pause / Resume tournament
router.patch('/:id/pause',   ctrl.pauseTournament.bind(ctrl));
router.patch('/:id/resume',  ctrl.resumeTournament.bind(ctrl));

module.exports = router;
