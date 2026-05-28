const AppError = require("../../../shared/errors/AppError");
const userRepository = require("../repository/user.repository");
const { toUserProfileDto } = require("../dto/userProfile.dto");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getUserProfile = async (userId) => {
  if (!userId || !UUID_PATTERN.test(userId)) {
    throw new AppError("A valid user id is required.", 400);
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User profile not found.", 404);
  }

  return toUserProfileDto(user);
};

const getAllUserProfiles = async () => {
  const users = await userRepository.findAll();

  return users.map(toUserProfileDto);
};

module.exports = {
  getUserProfile,
  getAllUserProfiles,
};
