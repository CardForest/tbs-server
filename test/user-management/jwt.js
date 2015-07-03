var assert = require('assert');
var UserJwt = require('../../main/user-management/jwt');
var createJwtSecret = require('../../util').createJwtSecret;

describe('user management', function () {
  var jwtSecret, jwtSecret2;

  before(function () {
    jwtSecret = createJwtSecret();
    jwtSecret2 = createJwtSecret();
  });

  describe('jwt', function () {
    it('can encode and decode', function () {
      var userJwt = new UserJwt(jwtSecret);

      var user = {_id: 'userId', role: 'userRole'};
      var decodedUser = userJwt.decode(userJwt.encode(user));

      assert.strictEqual(decodedUser._id, user._id);
      assert.strictEqual(decodedUser.role, user.role);
    });

    it('decoding fails with wrong key', function () {
      var userJwt = new UserJwt(jwtSecret);
      var otherUserJwt = new UserJwt(jwtSecret2);

      var user = {_id: 'userId', role: 'userRole'};
      assert.throws(
        function () {
          otherUserJwt.decode(userJwt.encode(user));
        },
        'Signature verification failed'
      );
    });

    it('allows impersonation for admins only', function () {
      var userJwt = new UserJwt(jwtSecret);

      var user = {_id: 'testId', role: 'admin'};
      var impersonatedUser = {_id: 'testId2', role: 'user'};
      var decodedUser = userJwt.decode(userJwt.encode(user), impersonatedUser);
      assert.strictEqual(decodedUser._id, impersonatedUser._id);
      assert.strictEqual(decodedUser.role, impersonatedUser.role);

      // ignore impersonation when user is not admin
      user.role = 'not_admin';
      decodedUser = userJwt.decode(userJwt.encode(user), impersonatedUser);
      assert.strictEqual(decodedUser._id, user._id);
      assert.strictEqual(decodedUser.role, user.role);
    });
  });
});
