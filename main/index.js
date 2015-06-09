var express = require('express');
var http = require('http');

function TbsServer(opt) {
  this.port = opt.port;

  var app = express();

  app.use(express.static(opt.mainStaticDir));
  app.use('/bower_components', express.static(opt.bowerStaticDir));

  this.server = http.createServer(app);
}

TbsServer.prototype.start = function(cb) {
  this.server.listen(this.port, cb);
};

TbsServer.prototype.stop = function(cb) {
  this.server.close(cb);
};

module.exports = TbsServer;
