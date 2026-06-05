const MAX_DISPLAY_NAME_LENGTH = 15;

const truncateDisplayName = (fullName) => {
  if (!fullName) {
    return fullName;
  }

  return Array.from(fullName).slice(0, MAX_DISPLAY_NAME_LENGTH).join("");
};

const toUserProfileDto = (user) => ({
  id: user.id,
  email: user.email,
  fullName: truncateDisplayName(user.fullName),
  role: user.role,
  avatarUrl: user.avatarUrl,
  isDisable: user.isDisable,
  providers: user.providers,
});

module.exports = {
  toUserProfileDto,
};
