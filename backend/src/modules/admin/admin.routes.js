const express = require('express');
const router = express.Router();
const ctrl = require('./controller/dashboard.controller');
const auth = require('../../shared/middleware/authenticateSupabaseUser');
const requireAdminUser = require('../../shared/middleware/requireAdminUser');

router.use(auth, requireAdminUser);

router.get('/dashboard', ctrl.getDashboardStats.bind(ctrl));

module.exports = router;
