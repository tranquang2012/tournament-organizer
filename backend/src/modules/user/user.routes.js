const express = require("express");
const userController = require("./controller/user.controller");
const authenticateSupabaseUser = require("../../shared/middleware/authenticateSupabaseUser");

const router = express.Router();

router.get("/me/profile", authenticateSupabaseUser, userController.getCurrentUserProfile);
router.get("/:userId/profile", userController.getUserProfile);

module.exports = router;
