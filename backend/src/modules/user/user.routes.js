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
router.patch(
  "/admin/:userId/disable",
  authenticateSupabaseUser,
  requireAdminUser,
  userController.disableUserAccount
);
router.patch(
  "/admin/:userId/enable",
  authenticateSupabaseUser,
  requireAdminUser,
  userController.enableUserAccount
);
router.patch(
  "/admin/:userId/promote",
  authenticateSupabaseUser,
  requireAdminUser,
  userController.promoteUserToAdmin
);
router.patch(
  "/admin/:userId/demote",
  authenticateSupabaseUser,
  requireAdminUser,
  userController.demoteAdminToUser
);
router.get("/me/profile", authenticateSupabaseUser, userController.getCurrentUserProfile);
router.patch("/me/profile", authenticateSupabaseUser, userController.updateCurrentUserProfile);
router.post("/me/avatar", authenticateSupabaseUser, userController.uploadCurrentUserAvatar);
router.get("/:userId/profile", userController.getUserProfile);

module.exports = router;
