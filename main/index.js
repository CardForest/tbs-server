var express = require('express');
var http = require('http');

function TbsServer(opt) {
  this.port = opt.port;

  var app = express();

  require('./middleware/security')(app, opt);
  // TODO logging goes here
  require('./middleware/robots')(app, opt);

  // TODO most of the logic should go here

  app.use(express.static(opt.mainStaticDir));
  app.use('/bower_components', express.static(opt.bowerStaticDir));

  require('./middleware/errors')(app);

  this.server = http.createServer(app);
}

TbsServer.prototype.start = function(cb) {
  this.server.listen(this.port, cb);
};

TbsServer.prototype.stop = function(cb) {
  this.server.close(cb);
};

module.exports = TbsServer;
