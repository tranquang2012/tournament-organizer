class Sport {
  constructor({ id, name, types, banner }) {
    this.id = id;
    this.name = name;
    this.types = types;
    this.banner = banner;
  }

  static fromDatabase(row) {
    return new Sport({
      id: row.sport_id,
      name: row.sport_name,
      types: row.sport_type || [],
      banner: row.sport_banner,
    });
  }
}

module.exports = Sport;
