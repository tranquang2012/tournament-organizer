class User {
  constructor({ id, email, fullName, role, avatarUrl, provider }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.avatarUrl = avatarUrl;
    this.provider = provider;
  }

  static fromDatabase(row) {
    return new User({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      avatarUrl: row.avatar_url,
      provider: row.provider,
    });
  }
}

module.exports = User;
