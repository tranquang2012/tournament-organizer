class User {
  constructor({ id, email, fullName, role, avatarUrl, isDisable }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.avatarUrl = avatarUrl;
    this.isDisable = isDisable === true;
  }

  static fromDatabase(row) {
    return new User({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      avatarUrl: row.avatar_url,
      isDisable: row.is_disable,
    });
  }
}

module.exports = User;
