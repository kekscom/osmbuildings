
// TODO: load tiles for a bbox
// TODO: allow WMS calls

var BLDGS = (function() {

  var baseURL = 'http://data.osmbuildings.org/0.2/';
  var cacheData = {};

  function xhr(url, callback, scope) {
    if (cacheData[url]) {
      if (typeof callback === 'function') {
        callback.call(scope, cacheData[url].json);
      }
      return;
    }

    var req = new XMLHttpRequest();

    req.onreadystatechange = function() {
      if (req.readyState !== 4) {
        return;
      }
      if (!req.status || req.status < 200 || req.status > 299) {
        return;
      }
      if (callback && req.responseText) {
        var json;
        try {
          json = JSON.parse(req.responseText);
        } catch(ex) {}
        cacheData[url] = { json: json, time: Date.now() };
        callback.call(scope, json);
      }
    };

    req.open('GET', url);
    req.send(null);

    return req;
  }

  function BLDGS(options) {
    options = options || {};

    baseURL +=  (options.key || 'anonymous');

    var maxAge = options.maxAge || 5*60*1000;

    setInterval(function() {
      var minTime = Date.now()-maxAge;
      for (var key in cacheData) {
        if (cacheData[key].time < minTime) {
          cacheData[key] = null;
        }
      }
    }, maxAge);
  };

  var proto = BLDGS.prototype;

  proto.getTile = function(x, y, zoom, callback, scope) {
    var url = baseURL +'/tile/'+ zoom +'/'+ x +'/'+ y +'.json';
    xhr(url, callback, scope);
  };

  proto.getFeature = function(id, callback, scope) {
    var url = baseURL +'/feature/'+ id +'.json';
    xhr(url, callback, scope);
  };

  return BLDGS;

}());
