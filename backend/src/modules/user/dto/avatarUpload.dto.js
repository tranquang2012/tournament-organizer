const toAvatarUploadDto = (body) => ({
  dataUrl: typeof body.dataUrl === "string" ? body.dataUrl : undefined,
  base64Data: typeof body.base64Data === "string" ? body.base64Data : undefined,
  contentType: typeof body.contentType === "string" ? body.contentType : undefined,
});

module.exports = {
  toAvatarUploadDto,
};
