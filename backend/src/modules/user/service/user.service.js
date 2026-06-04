const AppError = require("../../../shared/errors/AppError");
const userRepository = require("../repository/user.repository");
const { toUserProfileDto } = require("../dto/userProfile.dto");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_NAME_LENGTH = 100;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const SUPPORTED_AVATAR_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const SUPER_ADMIN_ROLES = new Set(["superadmin", "super_admin"]);
const ADMIN_ROLES = new Set(["admin", "superadmin", "super_admin"]);

const normalizeRole = (role) => {
  if (!role) {
    return "";
  }

  return String(role).trim().toLowerCase();
};

const isSuperAdminRole = (role) => SUPER_ADMIN_ROLES.has(normalizeRole(role));
const isAdminRole = (role) => ADMIN_ROLES.has(normalizeRole(role));

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

const getTargetUserOrThrow = async (targetUserId) => {
  if (!targetUserId || !UUID_PATTERN.test(targetUserId)) {
    throw new AppError("A valid target user id is required.", 400);
  }

  const targetUser = await userRepository.findById(targetUserId);

  if (!targetUser) {
    throw new AppError("Target user profile not found.", 404);
  }

  return targetUser;
};

const assertSuperAdmin = (actorProfile) => {
  if (!isSuperAdminRole(actorProfile?.role)) {
    throw new AppError("Super admin access is required.", 403);
  }
};

const disableUserAccount = async ({ actorUserId, actorProfile, targetUserId }) => {
  const targetUser = await getTargetUserOrThrow(targetUserId);

  if (actorUserId === targetUser.id) {
    throw new AppError("You cannot disable your own account.", 400);
  }

  const targetIsAdmin = isAdminRole(targetUser.role);

  if (targetIsAdmin && !isSuperAdminRole(actorProfile?.role)) {
    throw new AppError("Only super admins can disable admin accounts.", 403);
  }

  const updatedUser = await userRepository.updateById(targetUser.id, { isDisable: true });

  return toUserProfileDto(updatedUser);
};

const promoteUserToAdmin = async ({ actorProfile, targetUserId }) => {
  assertSuperAdmin(actorProfile);

  const targetUser = await getTargetUserOrThrow(targetUserId);

  if (isAdminRole(targetUser.role)) {
    throw new AppError("Target user is already an admin.", 400);
  }

  const updatedUser = await userRepository.updateById(targetUser.id, { role: "admin" });

  return toUserProfileDto(updatedUser);
};

const demoteAdminToUser = async ({ actorUserId, actorProfile, targetUserId }) => {
  assertSuperAdmin(actorProfile);

  const targetUser = await getTargetUserOrThrow(targetUserId);

  if (actorUserId === targetUser.id) {
    throw new AppError("You cannot demote your own account.", 400);
  }

  if (!isAdminRole(targetUser.role)) {
    throw new AppError("Target user is not an admin.", 400);
  }

  const updatedUser = await userRepository.updateById(targetUser.id, { role: "user" });

  return toUserProfileDto(updatedUser);
};

const updateCurrentUserProfile = async (userId, updateProfileDto) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(updateProfileDto, "fullName")) {
    const fullName = updateProfileDto.fullName;

    if (!fullName) {
      throw new AppError("Full name is required.", 400);
    }

    if (fullName.length > MAX_NAME_LENGTH) {
      throw new AppError(`Full name must be ${MAX_NAME_LENGTH} characters or fewer.`, 400);
    }

    updates.fullName = fullName;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("At least one profile field is required.", 400);
  }

  const user = await userRepository.updateById(userId, updates);

  if (!user) {
    throw new AppError("User profile not found.", 404);
  }

  return toUserProfileDto(user);
};

const parseAvatarUpload = (avatarUploadDto) => {
  if (avatarUploadDto.dataUrl) {
    const match = avatarUploadDto.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
      throw new AppError("Avatar data URL must be a base64 encoded image.", 400);
    }

    return {
      contentType: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  }

  if (!avatarUploadDto.base64Data || !avatarUploadDto.contentType) {
    throw new AppError("Avatar image data and content type are required.", 400);
  }

  return {
    contentType: avatarUploadDto.contentType,
    buffer: Buffer.from(avatarUploadDto.base64Data, "base64"),
  };
};

const uploadAvatarToSupabase = async ({ userId, accessToken, contentType, buffer }) => {
  const bucket = process.env.SUPABASE_AVATAR_BUCKET || "avatars";
  const extension = SUPPORTED_AVATAR_TYPES.get(contentType);
  const objectPath = `${userId}/avatar.${extension}`;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Supabase avatar upload failed:", errorText);
    throw new AppError(`Failed to upload avatar. Storage responded with ${response.status}.`, 502);
  }

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}`;
};

const uploadCurrentUserAvatar = async ({ userId, accessToken, avatarUploadDto }) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new AppError("Supabase storage is not configured.", 500);
  }

  const { contentType, buffer } = parseAvatarUpload(avatarUploadDto);

  if (!SUPPORTED_AVATAR_TYPES.has(contentType)) {
    throw new AppError("Avatar must be a JPEG, PNG, WEBP, or GIF image.", 400);
  }

  if (!buffer.length || buffer.length > MAX_AVATAR_BYTES) {
    throw new AppError("Avatar image must be smaller than 2 MB.", 400);
  }

  const avatarUrl = await uploadAvatarToSupabase({
    userId,
    accessToken,
    contentType,
    buffer,
  });

  const user = await userRepository.updateById(userId, { avatarUrl });

  if (!user) {
    throw new AppError("User profile not found.", 404);
  }

  return toUserProfileDto(user);
};

module.exports = {
  getUserProfile,
  getAllUserProfiles,
  disableUserAccount,
  promoteUserToAdmin,
  demoteAdminToUser,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
};
