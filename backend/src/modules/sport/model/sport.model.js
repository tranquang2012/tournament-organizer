class Sport {
  constructor({ id, name, types, banner, format }) {
    this.id = id;
    this.name = name;
    this.types = types;
    this.banner = banner;
    this.format = format;
  }

  static fromDatabase(row) {
    return new Sport({
      id: row.sport_id,
      name: row.sport_name,
      types: row.sport_type || [],
      banner: row.sport_banner,
      format: row.sport_format,
    });
  }
}

module.exports = Sport;
