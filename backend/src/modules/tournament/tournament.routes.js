const express = require('express');
const router = express.Router();
const ctrl = require('./controller/tournament.controller');
const auth = require('../../shared/middleware/authenticateSupabaseUser');
const { SPORT_RULES } = require('./config/sportRules.config');

router.get('/sport-rules', (req, res) => {
  res.json({ success: true, data: SPORT_RULES });
});

router.use(auth);

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

module.exports = router;