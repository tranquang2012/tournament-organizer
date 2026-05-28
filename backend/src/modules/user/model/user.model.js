class User {
  constructor({ id, email, fullName, role }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
  }

  static fromDatabase(row) {
    return new User({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
    });
  }
}

module.exports = User;
