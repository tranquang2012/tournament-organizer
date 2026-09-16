const express = require('express');
const router = express.Router();
const ctrl = require('./controller/dashboard.controller');
const chatCtrl = require('./controller/chat.controller');
const auth = require('../../shared/middleware/authenticateSupabaseUser');
const requireAdminUser = require('../../shared/middleware/requireAdminUser');

router.use(auth, requireAdminUser);

router.get('/dashboard', ctrl.getDashboardStats.bind(ctrl));
router.post('/chat', chatCtrl.chat.bind(chatCtrl));

module.exports = router;
