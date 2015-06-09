var express = require('express');
var http = require('http');

var config = require('./config');

var app = express();

app.use(express.static(config.mainStaticDir));
app.use('/bower_components', express.static(config.bowerStaticDir));

var server = http.createServer(app);

module.exports = {
  start: function(cb) {
    server.listen(config.port, function() {
      if (config.browserSyncProxyEnabled) {
        var request = require('request');
        request('http://localhost:' + config.browserSyncProxyPort + '/__browser_sync__?method=reload', function errorIgnorer() {});
      }
      cb(); //TODO put browserSync as a callback in client test/serve
    });
  },
  stop: function(cb) {
    server.close(cb);
  }
};
