
var BLDGS = (function() {

  var baseURL = 'http://{s}data.osmbuildings.org/0.2/{k}/tile/{z}/{x}/{y}.json';

  //var baseURL = 'http://ec2-54-93-84-172.eu-central-1.compute.amazonaws.com/0.2/'; // SMALL
  //var baseURL = 'http://ec2-54-93-72-52.eu-central-1.compute.amazonaws.com/0.2/'; // LARGE
  //var baseURL = 'http://localhost:8000/0.2/';
  //var baseURL = 'http://a.tiles.markware.net/rkc8ywdl/';

  var cacheData = {};
  var cacheIndex = [];
  var cacheSize = 0;
  var maxCacheSize = 0;

  function xhr(url, callback) {
    if (cacheData[url]) {
      if (callback) {
        callback(cacheData[url]);
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

        cacheData[url] = json;
        cacheIndex.push({ url: url, size: req.responseText.length });
        cacheSize += req.responseText.length;

        while (cacheSize > maxCacheSize) {
          var item = cacheIndex.shift();
          cacheSize -= item.size;
          delete cacheData[item.url];
        }

//  try {
//    storage.setItem('BLDGS', JSON.stringify(cacheData));
//  } catch(ex) {}

        callback(json);
      }
    };

    req.open('GET', url);
    req.send(null);

    return req;
  }

  function getDistance(a, b) {
    var dx = a.x-b.x, dy = a.y-b.y;
    return dx*dx + dy*dy;
  }

  function BLDGS(options) {
    options = options || {};

    if (options.tileSrc) {
      this.src = options.src;
    } else {
      this.src = baseURL.replace('{s}', '').replace('{k}', (options.key || 'anonymous'));
    }

    maxCacheSize = options.cacheSize || 1024*1024; // 1MB
  }

  BLDGS.TILE_SIZE = 256;
  BLDGS.ATTRIBUTION = 'Data Service &copy; <a href="http://bld.gs">BLD.GS</a>';

  var proto = BLDGS.prototype;

  proto.getTile = function(x, y, zoom, callback) {
    var url = this.tileSrc.replace('{x}', x).replace('{y}', y).replace('{z}', zoom);
    return xhr(url, callback);
  };

  proto.getAllTiles = function(x, y, w, h, zoom, callback) {
    var
      tileSize = BLDGS.TILE_SIZE,
      fixedZoom = 16,
      realTileSize = zoom > fixedZoom ? tileSize <<(zoom-fixedZoom) : tileSize >>(fixedZoom-zoom),
      minX = x/realTileSize <<0,
      minY = y/realTileSize <<0,
      maxX = Math.ceil((x+w)/realTileSize),
      maxY = Math.ceil((y+h)/realTileSize),
      tx, ty,
      queue = [];

    for (ty = minY; ty <= maxY; ty++) {
      for (tx = minX; tx <= maxX; tx++) {
        queue.push({ x:tx, y:ty, z:fixedZoom });
      }
    }

    var center = { x: x+(w-tileSize)/2, y: y+(h-tileSize)/2 };
		queue.sort(function(a, b) {
			return getDistance(a, center) - getDistance(b, center);
		});

		for (var i = 0, il = queue.length; i < il; i++) {
      this.getTile(queue[i].x, queue[i].y, queue[i].z, callback);
		}

    return {
      abort: function() {
        for (var i = 0; i < queue.length; i++) {
          queue[i].abort();
        }
      }
    };
  };

  return BLDGS;

}());
