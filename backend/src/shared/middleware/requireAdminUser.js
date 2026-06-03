const AppError = require("../errors/AppError");

const ADMIN_ROLES = new Set(["admin", "super_admin", "superadmin"]);

const requireAdminUser = (req, res, next) => {
  const role = req.auth?.profile?.role?.toLowerCase();

  if (!role || !ADMIN_ROLES.has(role)) {
    return next(new AppError("Admin access is required.", 403));
  }

  return next();
};

module.exports = requireAdminUser;
