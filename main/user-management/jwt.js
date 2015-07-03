var jwt = require('jwt-simple');

function UserJwt(secret) {
  this.secret = secret;
}

UserJwt.prototype.encode = function (user) {
  return jwt.encode({
      sub: user._id,
      role: user.role

      // TODO (maybe) add time verification
      //iat: moment().unix(),
      //exp: moment().add(14, 'days').unix(),
    },
    this.secret);
};

UserJwt.prototype.decode = function (token, impersonation) {
  var payload = jwt.decode(token, this.secret);
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

module.exports = UserJwt;
