var express = require('express');
var User = require('./mongoose');

function UserExpress(userJwt) {
  var ensureUser = this.ensureUser = function (req, res, next) {
    if (!req.headers.authorization) {
      res.status(401).send('missing authorization header');
    } else {
      try {
        var decoded = userJwt.decode(req.headers.authorization.slice(7), // remove 'Bearer ' prefix
          req.query.impersonationUserId ?
          {
            _id: req.query.impersonationUserId,
            role: req.query.impersonationUserRole
          } :
            undefined);
        req.userId = decoded._id;
        req.userRole = decoded.role;
        next();
      } catch (err) {
        res.status(401).send(err);
      }
    }
  };

  this.ensureAdmin = function (req, res, next) {
    ensureUser(req, res, function () {
      if (req.userRole === 'admin') {
        next();
      } else {
        res.status(401).send();
      }
    });
  }

  var router = this.router = express.Router();

  router.get('/me', this.ensureUser, function(req, res) {
    User.findById(req.userId, '-_id displayName avatarImageUrl', {lean: true}, function(err, user) {
      if (err || !user /* user not found is considered an error since the user is authenticated*/) {
        return res.status(500).send('unexpected server error');
      }
      res.send(user);
    });
  });
}

module.exports = UserExpress;

