const AppError = require("../errors/AppError");

const SUPER_ADMIN_ROLES = new Set(["super_admin", "superadmin"]);

const requireSuperAdminUser = (req, res, next) => {
  const role = req.auth?.profile?.role?.toLowerCase();

  if (!role || !SUPER_ADMIN_ROLES.has(role)) {
    return next(new AppError("Super admin access is required.", 403));
  }

  return next();
};

module.exports = requireSuperAdminUser;
