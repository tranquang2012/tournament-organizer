const express = require("express");
const userController = require("./controller/user.controller");
const authenticateSupabaseUser = require("../../shared/middleware/authenticateSupabaseUser");
const requireSuperAdminUser = require("../../shared/middleware/requireSuperAdminUser");

const router = express.Router();

router.get(
  "/admin/profiles",
  authenticateSupabaseUser,
  requireSuperAdminUser,
  userController.getAllUserProfiles
);
router.patch(
  "/admin/:userId/disable",
  authenticateSupabaseUser,
  requireSuperAdminUser,
  userController.disableUserAccount
);
router.patch(
  "/admin/:userId/enable",
  authenticateSupabaseUser,
  requireSuperAdminUser,
  userController.enableUserAccount
);
router.patch(
  "/admin/:userId/promote",
  authenticateSupabaseUser,
  requireSuperAdminUser,
  userController.promoteUserToAdmin
);
router.patch(
  "/admin/:userId/demote",
  authenticateSupabaseUser,
  requireSuperAdminUser,
  userController.demoteAdminToUser
);
router.get("/me/profile", authenticateSupabaseUser, userController.getCurrentUserProfile);
router.patch("/me/profile", authenticateSupabaseUser, userController.updateCurrentUserProfile);
router.post("/me/avatar", authenticateSupabaseUser, userController.uploadCurrentUserAvatar);
router.get("/:userId/profile", userController.getUserProfile);

module.exports = router;
