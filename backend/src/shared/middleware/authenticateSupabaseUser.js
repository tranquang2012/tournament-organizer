const AppError = require("../errors/AppError");
const userRepository = require("../../modules/user/repository/user.repository");

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  return scheme === "Bearer" && token ? token : null;
};

const authenticateSupabaseUser = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError("Authentication token is required.", 401);
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new AppError("Supabase auth is not configured.", 500);
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new AppError("Invalid or expired authentication token.", 401);
    }

    const user = await response.json();

    if (!user.id) {
      throw new AppError("Invalid authentication token.", 401);
    }

    const profile = await userRepository.findById(user.id);

    if (profile?.isDisable === true) {
      throw new AppError("Your account has been disabled.", 403);
    }

    req.auth = {
      user,
      userId: user.id,
      accessToken: token,
      profile,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateSupabaseUser;
