const AppError = require("../errors/AppError");

const errorHandler = (error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    error: {
      message: "Internal server error.",
    },
  });
};

module.exports = errorHandler;
