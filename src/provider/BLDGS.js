
// TODO: load tiles for a bbox
// TODO: allow WMS calls

var BLDGS = (function() {

  var baseURL = 'http://data.osmbuildings.org/0.2/';

  // http://mathiasbynens.be/notes/localstorage-pattern#comment-9
  var storage;
  try {
    storage = localStorage;
  } catch (ex) {
    storage = (function() {
      return {
        getItem: function() {},
        setItem: function() {}
      };
    }());
  }

  var cacheData = JSON.parse(storage.getItem('BLDGS') || '{}');

  function xhr(url, callback) {
    if (cacheData[url]) {
      if (callback) {
        callback(cacheData[url].json);
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
        callback(json);
      }
    };

    req.open('GET', url);
    req.send(null);

    return req;
  }

  function BLDGS(options) {
    options = options || {};

    baseURL += (options.key || 'anonymous');

    var maxAge = options.maxAge || 5*60*1000;

    setInterval(function() {
      var minTime = Date.now()-maxAge;
      var newCacheData = {};
      for (var key in cacheData) {
        if (cacheData[key].time >= minTime) {
          newCacheData[key] = cacheData[key];
        }
      }
      cacheData = newCacheData;
    }, maxAge);
  };

//  // TODO: for current viewport or last n items only
//  try {
//    storage.setItem('BLDGS', JSON.stringify(cacheData));
//  } catch(ex) {}

  var proto = BLDGS.prototype;

  proto.getTile = function(x, y, zoom, callback) {
    var url = baseURL +'/tile/'+ zoom +'/'+ x +'/'+ y +'.json';
    xhr(url, callback);
  };

  proto.getFeature = function(id, callback) {
    var url = baseURL +'/feature/'+ id +'.json';
    xhr(url, callback);
  };

  return BLDGS;

}());
