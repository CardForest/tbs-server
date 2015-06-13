var winston = require("winston");
var winstonStream = require("winston-stream");

module.exports = {
  mainStaticDir: process.env.MAIN_STATIC_DIR || 'test/app_fixture/main',
  bowerStaticDir: process.env.BOWER_STATIC_DIR || 'test/app_fixture/bower',
  port: process.env.PORT || 9000,
  log: winston,
  httpLogStream: winstonStream(winston, "verbose"),
  userJwtSecretKey: process.env.USER_JWT_SECRET_KEY || 'Z0d+vAYr1CXV6n2ICyg/djic'
};
