const toUserProfileDto = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});

module.exports = {
  toUserProfileDto,
};
