const userService = require("../service/user.service");

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

module.exports = {
  getUserProfile,
  getCurrentUserProfile,
  getAllUserProfiles,
};
