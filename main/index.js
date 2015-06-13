var express = require('express');
var http = require('http');
var morgan = require('morgan');
var WS = require('sane-web-socket/server');

var UserManager = require('./userManager');



function TbsServer(opt) {
  this.port = opt.port;

  var app = express();

  require('./middleware/security')(app);

  // TODO http logging should route to winston on production
  app.use(morgan('combined', {
    stream: opt.httpLogStream
  }));

  require('./middleware/robots')(app, opt);

  //TODO app.use(require('serve-favicon')(config.get('paths.favicon')));

  // TODO (maybe) something like http-static-gzip-regexp and grunt-contrib-compress
  app.use(require('compression')());

  app.use(require('body-parser').json());

  // TODO most of the logic should go here
  var userManager = new UserManager({
    userJwtSecretKey: opt.userJwtSecretKey
  });
  app.use('/users', userManager.express.router);

  // TODO set { maxAge: '7d' } cache in production
  app.use(express.static(opt.mainStaticDir));
  app.use('/bower_components', express.static(opt.bowerStaticDir));

  require('./middleware/errors')(app);

  this.server = http.createServer(app);

  this.server.on('listening', function() {
    opt.log.info('server starts listening on port ' + this.address().port);
  });

  this.server.on('error', function(err) {
    opt.log.error(err);
  });

  this.server.on('close', function() {
    opt.log.info('server is closed');
  });

  this.ws = new WS(userManager);
  // TODO something like this with userManager:
  //  opt.ws.on('authenticate', function (connection, msg) {
  //    var decoded = this.userJwt.decode(msg.token, msg.impersonationUserId ?
  //    {
  //      _id: msg.impersonationUserId,
  //      role: msg.impersonationUserRole
  //    } :
  //      undefined);
  //    connection.userId = decoded._id;
  //    connection.userRole = decoded.role;
  //
  //    return 'OK';
  //  });
}

TbsServer.prototype.start = function(cb) {
  return this.ws.start(this.server, this.port).asCallback(cb);
};

TbsServer.prototype.stop = function(cb) {
  return this.ws.stop().asCallback(cb);
};

module.exports = TbsServer;
