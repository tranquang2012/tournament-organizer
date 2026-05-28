const express = require("express");
const userController = require("./controller/user.controller");
const authenticateSupabaseUser = require("../../shared/middleware/authenticateSupabaseUser");
const requireAdminUser = require("../../shared/middleware/requireAdminUser");

const router = express.Router();

router.get(
  "/admin/profiles",
  authenticateSupabaseUser,
  requireAdminUser,
  userController.getAllUserProfiles
);
router.get("/me/profile", authenticateSupabaseUser, userController.getCurrentUserProfile);
router.get("/:userId/profile", userController.getUserProfile);

module.exports = router;
