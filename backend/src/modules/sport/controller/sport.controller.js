const sportService = require("../service/sport.service");

const getSports = async (req, res, next) => {
  try {
    const sports = await sportService.getSports();

    res.json({
      data: sports,
    });
  } catch (error) {
    next(error);
  }
};

const getSportById = async (req, res, next) => {
  try {
    const sport = await sportService.getSportById(req.params.sportId);

    res.json({
      data: sport,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSports,
  getSportById,
};
