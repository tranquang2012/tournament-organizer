const toSportDto = (sport) => ({
  id: sport.id,
  name: sport.name,
  types: sport.types,
  banner: sport.banner,
});

module.exports = {
  toSportDto,
};
