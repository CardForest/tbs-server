module.exports = function(app, opt){
  // disallow crawling of bower_components on production
  // and disallow everything on any other environment
  var robotsTxt = 'User-agent: *\nDisallow: ' + ((opt.env === 'production') ? '/bower_components/' : '/');
  //TODO update external to point to the actual folder currently used
  app.get('/robots.txt', function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });
};
