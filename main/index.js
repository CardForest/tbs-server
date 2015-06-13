var express = require('express');
var http = require('http');
var morgan = require('morgan');

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
  //require('./components/user-management')(app, opt);

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
}

TbsServer.prototype.start = function(cb) {
  this.server.listen(this.port, cb);
};

TbsServer.prototype.stop = function(cb) {
  this.server.close(cb);
};

module.exports = TbsServer;
