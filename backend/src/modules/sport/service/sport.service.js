const AppError = require("../../../shared/errors/AppError");
const sportRepository = require("../repository/sport.repository");
const { toSportDto } = require("../dto/sport.dto");

const parseSportId = (sportId) => {
  const parsedSportId = Number(sportId);

  if (!Number.isInteger(parsedSportId) || parsedSportId <= 0) {
    throw new AppError("A valid sport id is required.", 400);
  }

  return parsedSportId;
};

const getSports = async () => {
  const sports = await sportRepository.findAll();

  return sports.map(toSportDto);
};

const getSportById = async (sportId) => {
  const parsedSportId = parseSportId(sportId);
  const sport = await sportRepository.findById(parsedSportId);

  if (!sport) {
    throw new AppError("Sport not found.", 404);
  }

  return toSportDto(sport);
};

module.exports = {
  getSports,
  getSportById,
};
