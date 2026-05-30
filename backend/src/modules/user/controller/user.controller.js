const userService = require("../service/user.service");
const { toUpdateUserProfileDto } = require("../dto/updateUserProfile.dto");
const { toAvatarUploadDto } = require("../dto/avatarUpload.dto");

const getUserProfile = async (req, res, next) => {
  try {
    const userProfile = await userService.getUserProfile(req.params.userId);

    res.json({
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUserProfile = async (req, res, next) => {
  try {
    const userProfile = await userService.getUserProfile(req.auth.userId);

    res.json({
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

const getAllUserProfiles = async (req, res, next) => {
  try {
    const userProfiles = await userService.getAllUserProfiles();

    res.json({
      data: userProfiles,
    });
  } catch (error) {
    next(error);
  }
};

const updateCurrentUserProfile = async (req, res, next) => {
  try {
    const userProfile = await userService.updateCurrentUserProfile(
      req.auth.userId,
      toUpdateUserProfileDto(req.body)
    );

    res.json({
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

const uploadCurrentUserAvatar = async (req, res, next) => {
  try {
    const userProfile = await userService.uploadCurrentUserAvatar({
      userId: req.auth.userId,
      accessToken: req.auth.accessToken,
      avatarUploadDto: toAvatarUploadDto(req.body),
    });

    res.json({
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getCurrentUserProfile,
  getAllUserProfiles,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
};
