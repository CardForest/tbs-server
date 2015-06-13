var jwt = require('jwt-simple');
var crypto = require('crypto');

function UserJwt(secretKey) {
  this.secretKey = secretKey;
}

UserJwt.prototype.encode = function (user) {
  return jwt.encode({
      sub: user._id,
      role: user.role

      // TODO (maybe) add time verification
      //iat: moment().unix(),
      //exp: moment().add(14, 'days').unix(),
    },
    this.secretKey);
};

UserJwt.prototype.decode = function (token, impersonation) {
  var payload = jwt.decode(token, this.secretKey);
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

UserJwt.createSecretKey = function() {
  return crypto.randomBytes(18 /* avoid padding by using a number which is divisible by 3 */).toString('base64');
};

module.exports = UserJwt;
