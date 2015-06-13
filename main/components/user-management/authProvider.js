var jwt = require('jwt-simple');
var moment = require('moment');

function AuthProvider(opt) {
  this.tokenSecret = opt.tokenSecret;
}

AuthProvider.prototype.createUserToken = function (user) {
  return jwt.encode({
      sub: user._id,
      iat: moment().unix(),
      role: user.role
    },
    this.tokenSecret);
};

AuthProvider.prototype.decodeUserToken = function (token, impersonation) {
  var payload = jwt.decode(token, this.tokenSecret);
  return (payload.role === 'admin' && impersonation) ?
  {
    _id: 	impersonation._id,
    role: impersonation.role
  } :
  {
    _id: 	payload.sub,
    role: payload.role
  };
};

AuthProvider.prototype.ensureUserMiddleware = function (req, res, next) {
	if (!req.headers.authorization) {
		res.status(401).send('Please Make Sure Your Request Has an Authorization Header');
	} else {
    try {
		  var decoded = this.decodeUserToken(req.headers.authorization.slice(7), // remove 'Bearer ' prefix
                                          req.query.impersonationUserId ?
                                            {_id: req.query.impersonationUserId,
                                              role: req.query.impersonationUserRole} :
                                            undefined);
      req.userId = decoded._id;
      req.userRole = decoded.role;
      next();
    } catch (err) {
      res.status(401).send(err);
    }
	}
};

AuthProvider.prototype.ensureAdminMiddleware = function (req, res, next) {
  this.ensureUserMiddleware(req, res, function() {
    if (req.userRole === 'admin') {
      next();
    } else {
      res.status(401).send();
    }
  });
};

module.exports = AuthProvider;
