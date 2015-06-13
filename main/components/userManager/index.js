var UserJwt = require('./userJwt');
var express = require('express');
var User = require('./model');
//var request = require('request');

var expressMiddleware = {
  ensureUser: function (userJwtDecode, req, res, next) {
    if (!req.headers.authorization) {
      res.status(401).send('Please Make Sure Your Request Has an Authorization Header');
    } else {
      try {
        var decoded = userJwtDecode(req.headers.authorization.slice(7), // remove 'Bearer ' prefix
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
  },
  ensureAdmin: function (ensureUser, req, res, next) {
    ensureUser(req, res, function () {
      if (req.userRole === 'admin') {
        next();
      } else {
        res.status(401).send();
      }
    });
  }
};

var expressRoutes = {
  getMe: function(req, res) {
    User.findById(req.userId, '-_id displayName avatarImageUrl', {lean: true}, function(err, user) {
      if (err) {
        return res.status(500).send('Failed While Accessing the Database');
      }
      res.send(user);
    });
  },
  getUsers: function(req, res) {
    User.find({}, '_id displayName avatarImageUrl role email', {lean: true},  function(err, users) {
      if (err) {
        return res.status(500).send({ message: 'Could not read users from database' });
      }
      res.send(users);
    });
  }
};

function UserManager(opt) {
  //this.authProviders = opt.authProviders;

  this.userJwt = new UserJwt(opt.userJwtSecretKey);

  this.express = {};

  this.express.ensureUser = expressMiddleware.ensureUser.bind(null, this.userJwt.decode.bind(this.userJwt));
  this.express.ensureAdmin = expressMiddleware.ensureAdmin.bind(null, this.express.ensureUser);

  var router = this.express.router = express.Router();

  router.get('/me', this.express.ensureUser, expressRoutes.getMe);
  router.get('/', this.express.ensureAdmin, expressRoutes.getUsers);

  //this.router.post('/auth/google', UserManager.prototype.routes.authenticateWithGoogle.bind(this));

}

//
//UserManager.prototype.routes = {
//  authenticateWithGoogle: function(req, res) {
//    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
//    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
//    var params = {
//      code: req.body.code,
//      client_id: req.body.clientId,
//      client_secret: this.authProviders.google.secret,
//      redirect_uri: req.body.redirectUri,
//      grant_type: 'authorization_code'
//    };
//
//    // Step 1. Exchange authorization code for access token.
//    request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
//      var accessToken = token.access_token;
//      var headers = { Authorization: 'Bearer ' + accessToken };
//
//      // Step 2. Retrieve profile information about the current user.
//      request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
//        // TODO handle google error
//        //// Step 3a. Link user accounts.
//        //if (req.headers.authorization) {
//        //	User.findOne({ google: profile.sub }, function(err, existingUser) {
//        //		if (existingUser) {
//        //			return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
//        //		}
//        //		var token = req.headers.authorization.split(' ')[1];
//        //		var payload = jwt.decode(token, config.get('auth.tokenSecret'));
//        //		User.findById(payload.sub, function(err, user) {
//        //			if (!user) {
//        //				return res.status(400).send({ message: 'User not found' });
//        //			}
//        //			user.google = profile.sub;
//        //			user.displayName = user.displayName || profile.name;
//        //			user.save(function() {
//        //				var token = createToken(user);
//        //				res.send({ token: token });
//        //			});
//        //		});
//        //	});
//        //} else {
//        // Step 3b. Create a new user account or return an existing one.
//        User.findOne({linkedProviders: {google: profile.sub}}, function(err, existingUser) {
//          if (err) {
//            return res.status(500).send('Failed While Accessing the Database');
//          }
//          if (existingUser) {
//            return res.send({
//              displayName: existingUser.displayName,
//              avatarImageUrl: existingUser.avatarImageUrl,
//              token: this.jwt.createToken(existingUser)
//            });
//          }
//          var user = new User();
//          user.linkedProviders = user.linkedProviders || {};
//          user.linkedProviders.google = profile.sub;
//          user.displayName = profile.name;
//          user.email = profile.email;
//          user.avatarImageUrl = profile.picture;
//          user.save(function(err) {
//            if (err) {
//              return res.status(500).send('Failed While Accessing the Database');
//            }
//            return res.send({
//              displayName: user.displayName,
//              avatarImageUrl: user.avatarImageUrl,
//              token: this.jwt.createToken(user)
//            });
//          });
//        });
//        //}
//      });
//    });
//  }
//};

module.exports = UserManager;
