const test = require('node:test');
const assert = require('node:assert/strict');
const requireSuperAdminUser = require('../src/shared/middleware/requireSuperAdminUser');

test('requireSuperAdminUser rejects admin and user roles', () => {
  for (const role of ['admin', 'user', '', undefined]) {
    let err = null;
    requireSuperAdminUser({ auth: { profile: { role } } }, {}, (e) => { err = e; });
    assert.equal(err?.statusCode, 403);
    assert.equal(err?.message, 'Super admin access is required.');
  }
});

test('requireSuperAdminUser allows super_admin and superadmin', () => {
  for (const role of ['super_admin', 'superadmin', 'Super_Admin']) {
    let err = undefined;
    requireSuperAdminUser({ auth: { profile: { role } } }, {}, (e) => { err = e; });
    assert.equal(err, undefined);
  }
});
