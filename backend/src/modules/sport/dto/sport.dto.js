const toSportDto = (sport) => ({
  id: sport.id,
  name: sport.name,
  types: sport.types,
  banner: sport.banner,
  format: sport.format,
});

module.exports = {
  toSportDto,
};
