var di = require('di');
var Test = require('./Test');

function RealTest() {
}

RealTest.prototype.toString = function() {
  return 'this is working for real?';
}

di.annotate(RealTest, new di.Provide(Test));

module.exports = RealTest;
