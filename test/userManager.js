var mongoose = require('mongoose');

var assert = require('assert');
var request = require('request');
var UserManager = require('../main/components/userManager/');
var UserJwt = require('../main/components/userManager/userJwt');
var User = require('../main/components/userManager/model');

describe('user manager', function () {
  var userJwtSecretKey, userJwtSecretKey2;

  before(function () {
    userJwtSecretKey = UserJwt.createSecretKey();
    userJwtSecretKey2 = UserJwt.createSecretKey();
  });

  describe('user jwt', function () {
    it('user jwt can encode and decode', function () {
      var userJwt = new UserJwt(userJwtSecretKey);

      var user = {_id: 'userId', role: 'userRole'};
      var decodedUser = userJwt.decode(userJwt.encode(user));

      assert.strictEqual(decodedUser._id, user._id);
      assert.strictEqual(decodedUser.role, user.role);
    });

    it('user jwt decoding fails with wrong key', function () {
      var userJwt = new UserJwt(userJwtSecretKey);
      var otherUserJwt = new UserJwt(userJwtSecretKey2);

      var user = {_id: 'userId', role: 'userRole'};
      assert.throws(
        function () {
          otherUserJwt.decode(userJwt.encode(user));
        },
        'Signature verification failed'
      );
    });

    it('should allow impersonation for admins only', function () {
      var userJwt = new UserJwt(userJwtSecretKey);

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

  describe('express', function () {
    var server;
    var userManager;

    before(function (done) {
      var express = require('express');
      var http = require('http');
      var app = express();

      userManager = new UserManager({
        userJwtSecretKey: userJwtSecretKey
      });
      app.get('/userOnly', userManager.express.ensureUser, function (req, res) {
        res.send('OK userId: ' + req.userId);
      });

      app.get('/adminOnly', userManager.express.ensureAdmin, function (req, res) {
        res.send('OK userId: ' + req.userId);
      });

      app.use('/users', userManager.express.router);

      server = http.createServer(app);
      server.listen('9000', done);
    });

    after(function (done) {
      server.close(done);
    });

    describe('middleware', function () {
      it('return 401 when authorization header is missing', function (done) {
        request('http://localhost:9000/userOnly', function (error, response) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 401);
          done();
        });
      });

      it('return 401 when authorization header is wrong', function (done) {
        request({
          url: 'http://localhost:9000/userOnly',
          headers: {
            authorization: 'Bearer not real token'
          }
        }, function (error, response) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 401);
          done();
        });
      });

      it('allow user when authorization header is OK', function (done) {
        var user = {_id: 'testId', role: 'user'};

        request({
          url: 'http://localhost:9000/userOnly',
          headers: {
            authorization: 'Bearer ' + userManager.userJwt.encode(user)
          }
        }, function (error, response, body) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 200);
          assert.strictEqual(body, 'OK userId: testId');
          done();
        });
      });

      it('disallow user into admin area', function (done) {
        var user = {_id: 'testId', role: 'user'};

        request({
          url: 'http://localhost:9000/adminOnly',
          headers: {
            authorization: 'Bearer ' + userManager.userJwt.encode(user)
          }
        }, function (error, response) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 401);
          done();
        });
      });

      it('allow admin into admin area', function (done) {
        var user = {_id: 'testId', role: 'admin'};

        request({
          url: 'http://localhost:9000/adminOnly',
          headers: {
            authorization: 'Bearer ' + userManager.userJwt.encode(user)
          }
        }, function (error, response, body) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 200);
          assert.strictEqual(body, 'OK userId: testId');
          done();
        });
      });

      it('allow impersonation query parameters', function (done) {
        var user = {_id: 'testId', role: 'admin'};
        var impersonatedUser = {_id: 'testId2', role: 'user'};
        request({
          url: 'http://localhost:9000/userOnly?impersonationUserId=' + impersonatedUser._id +
          '&impersonationUserRole=' + impersonatedUser.role,
          headers: {
            authorization: 'Bearer ' + userManager.userJwt.encode(user)
          }
        }, function (error, response, body) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 200);
          assert.strictEqual(body, 'OK userId: testId2');
          done();
        });
      });

      it('ignore impersonation query parameters when requester is not admin', function (done) {
        var user = {_id: 'testId', role: 'user'};
        var impersonatedUser = {_id: 'testId2', role: 'user'};
        request({
          url: 'http://localhost:9000/userOnly?impersonationUserId=' + impersonatedUser._id +
          '&impersonationUserRole=' + impersonatedUser.role,
          headers: {
            authorization: 'Bearer ' + userManager.userJwt.encode(user)
          }
        }, function (error, response, body) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 200);
          assert.strictEqual(body, 'OK userId: testId');
          done();
        });
      });
    });

    describe('routes', function () {

      var users;
      before(function (done) {
        mongoose.connection.once('open', function() {
          mongoose.connection.db.dropDatabase(function () {
            User.create([
              { displayName: 'Test Id', role: 'admin', email: 'test@mail.com', avatarImageUrl: 'http://test.com' },
              { displayName: 'Test Id2', email: 'test2@mail.com' }], function(err, _users) {
              if (err) {
                done(err);
              } else {
                var toObjectOpt = {
                  transform: function (doc, ret) {
                    ret._id = doc._id.toString();
                    delete ret.__v;
                  }
                };
                users = [_users[0].toObject(toObjectOpt), _users[1].toObject(toObjectOpt)];
                done();
              }
            });
          });
        });
        mongoose.connect('mongodb://localhost/test');
      });

      after(function (done) {
        mongoose.connection.close(done);
      });

      it('/me returns current user data', function(done) {
        request({
          url: 'http://localhost:9000/users/me',
          headers: {
            authorization: 'Bearer ' + userManager.userJwt.encode(users[0])
          }
        }, function (error, response, body) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 200);
          var returnedUser = JSON.parse(body);
          assert.strictEqual(returnedUser.displayName, 'Test Id');
          assert.strictEqual(returnedUser.avatarImageUrl, 'http://test.com');
          done();
        });
      });

      it('/ returns all users', function(done) {
        request({
          url: 'http://localhost:9000/users/',
          headers: {
            authorization: 'Bearer ' + userManager.userJwt.encode(users[0])
          }
        }, function (error, response, body) {
          assert.ifError(error);
          assert.strictEqual(response.statusCode, 200);
          var returnedUsers = JSON.parse(body);
          assert.deepEqual(returnedUsers, users);
          done();
        });
      });
    });
  });
});
