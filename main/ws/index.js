var di = require('di');
var Test = require('./test');

function WS(test) {
  console.log('got ' + test);
}

di.annotate(WS, new di.Inject(Test));

module.exports = WS;

var RealTest = require('./realTest');
var injector = new di.Injector([RealTest]);


var ws = injector.get(WS);

