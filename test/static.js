var assert = require('assert');
var request = require('request');
var TbsServer = require('../main');
describe('Static server', function() {
  var server;
  before(function (done) {
    server = new TbsServer({
      port: 9000,
      mainStaticDir: 'test/app_fixture/main',
      bowerStaticDir: 'test/app_fixture/bower'}
    );
    server.start(done);
  });

  after(function (done) {
    server.stop(done);
  });

  it('should return main static files', function(done) {
    request('http://localhost:9000/fixture.txt', function (error, response, body) {
      assert.ifError(error);
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(body, 'main static');
      done();
    });
  });

  it('should return bower static files', function(done) {
    request('http://localhost:9000/bower_components/fixture.txt', function (error, response, body) {
      assert.ifError(error);
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(body, 'bower static');
      done();
    });
  });
});
