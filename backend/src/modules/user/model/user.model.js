class User {
  constructor({ id, email, fullName, role, avatarUrl, isDisable, providers = [] }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.avatarUrl = avatarUrl;
    this.isDisable = isDisable;
    this.providers = providers;
  }

  static fromDatabase(row) {
    return new User({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      avatarUrl: row.avatar_url,
      isDisable: row.is_disable,
      providers: row.providers || [],
    });
  }
}

module.exports = User;
