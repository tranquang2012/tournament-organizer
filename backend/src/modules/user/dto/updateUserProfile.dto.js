const toUpdateUserProfileDto = (body) => ({
  fullName: typeof body.fullName === "string" ? body.fullName.trim() : undefined,
});

module.exports = {
  toUpdateUserProfileDto,
};
