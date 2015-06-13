var assert = require('assert');
var request = require('request');
var AuthProvider = require('../../main/components/user-management/authProvider');

describe('auth provider', function() {
  var auth;
  before(function (done) {
    require('crypto').randomBytes(18 /* avoid padding by using a number which is divisible by 3 */, function(err, buf) {
      if (err) {
        done(err);
      } else {
        auth = new AuthProvider({
          tokenSecret: buf.toString('base64')
        });
        done();
      }
    });


  });

  it('should be able to encode and decode', function() {
    var user = {_id: 'testId', role : 'user'};
    var decodedUser = auth.decodeUserToken(auth.createUserToken(user));
    assert.strictEqual(decodedUser._id, user._id);
    assert.strictEqual(decodedUser.role, user.role);
  });

  it('should allow impersonation for admins', function() {
    var user = {_id: 'testId', role : 'admin'};
    var impersonatedUser = {_id: 'testId2', role : 'user'};
    var decodedUser = auth.decodeUserToken(auth.createUserToken(user), impersonatedUser);
    assert.strictEqual(decodedUser._id, impersonatedUser._id);
    assert.strictEqual(decodedUser.role, impersonatedUser.role);

    // ignore impersonation when user is not admin
    user.role = 'not_admin';
    decodedUser = auth.decodeUserToken(auth.createUserToken(user), impersonatedUser);
    assert.strictEqual(decodedUser._id, user._id);
    assert.strictEqual(decodedUser.role, user.role);
  });

  describe('express interface', function () {
    var server;
    before(function (done) {
      var express = require('express');
      var http = require('http');
      var app = express();

      app.get('/user', auth.ensureUserMiddleware.bind(auth), function(req, res) {
        res.send('OK userId: ' + req.userId);
      });

      app.get('/admin', auth.ensureAdminMiddleware.bind(auth), function(req, res) {
        res.send('OK userId: ' + req.userId);
      });

      server = http.createServer(app);
      server.listen('9000', done);
    });

    after(function(done) {
      server.close(done);
    });

    it('return 401 when authorization header is missing', function(done) {
      request('http://localhost:9000/user', function (error, response) {
        assert.ifError(error);
        assert.strictEqual(response.statusCode, 401);
        done();
      });
    });

    it('return 401 when authorization header is wrong', function(done) {
      request({
        url: 'http://localhost:9000/user',
        headers: {
          authorization: 'Bearer not real token'
        }
      }, function (error, response) {
        assert.ifError(error);
        assert.strictEqual(response.statusCode, 401);
        done();
      });
    });

    it('allow user when authorization header is OK', function(done) {
      var user = {_id: 'testId', role : 'user'};

      request({
        url: 'http://localhost:9000/user',
        headers: {
          authorization: 'Bearer ' + auth.createUserToken(user)
        }
      }, function (error, response, body) {
        assert.ifError(error);
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(body, 'OK userId: testId');
        done();
      });
    });

    it('disallow user into admin area', function(done) {
      var user = {_id: 'testId', role : 'user'};

      request({
        url: 'http://localhost:9000/admin',
        headers: {
          authorization: 'Bearer ' + auth.createUserToken(user)
        }
      }, function (error, response) {
        assert.ifError(error);
        assert.strictEqual(response.statusCode, 401);
        done();
      });
    });

    it('allow admin into admin area', function(done) {
      var user = {_id: 'testId', role : 'admin'};

      request({
        url: 'http://localhost:9000/admin',
        headers: {
          authorization: 'Bearer ' + auth.createUserToken(user)
        }
      }, function (error, response, body) {
        assert.ifError(error);
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(body, 'OK userId: testId');
        done();
      });
    });

    it('allow impersonation query parameters', function(done) {
      var user = {_id: 'testId', role : 'admin'};
      var impersonatedUser = {_id: 'testId2', role : 'user'};
      request({
        url: 'http://localhost:9000/user?impersonationUserId=' + impersonatedUser._id +
                                        '&impersonationUserRole=' + impersonatedUser.role,
        headers: {
          authorization: 'Bearer ' + auth.createUserToken(user)
        }
      }, function (error, response, body) {
        assert.ifError(error);
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(body, 'OK userId: testId2');
        done();
      });
    });

    it('ignore impersonation query parameters when requester is not admin', function(done) {
      var user = {_id: 'testId', role : 'user'};
      var impersonatedUser = {_id: 'testId2', role : 'user'};
      request({
        url: 'http://localhost:9000/user?impersonationUserId=' + impersonatedUser._id +
        '&impersonationUserRole=' + impersonatedUser.role,
        headers: {
          authorization: 'Bearer ' + auth.createUserToken(user)
        }
      }, function (error, response, body) {
        assert.ifError(error);
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(body, 'OK userId: testId');
        done();
      });
    });
  });
});
