var crypto = require('crypto');

module.exports = {
  createJwtSecret: function () {
    return crypto.randomBytes(18 /* avoid padding by using a number which is divisible by 3 */).toString('base64');
  }
};
