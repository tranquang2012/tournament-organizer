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

module.exports = {
  getUserProfile,
};
