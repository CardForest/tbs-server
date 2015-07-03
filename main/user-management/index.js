var jwtSecret = require('config').get('jwtSecret');
var userJwt = new (require('./jwt'))(jwtSecret);

module.exports = {
  express: new (require('./express'))(userJwt),
  socketIO: new (require('./socketIO'))(userJwt),
  User: require('./mongoose')
};
