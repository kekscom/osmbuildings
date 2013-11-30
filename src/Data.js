var Data = (function() {

  var _url,
    _isStatic,
    _staticData,
    _currentItemsIndex = {}; // maintain a list of cached items in order to avoid duplicates on tile borders

  function _cropDecimals(num) {
    return parseFloat(num.toFixed(5));
  }

  function _getSquareSegmentDistance(px, py, p1x, p1y, p2x, p2y) {
    var dx = p2x-p1x, dy = p2y-p1y,
      t;
    if (dx !== 0 || dy !== 0) {
      t = ((px-p1x) * dx + (py-p1y) * dy) / (dx*dx + dy*dy);
      if (t > 1) {
        p1x = p2x;
        p1y = p2y;
      } else if (t > 0) {
        p1x += dx*t;
        p1y += dy*t;
      }
    }
    dx = px-p1x;
    dy = py-p1y;
    return dx*dx + dy*dy;
  }

  function _simplifyPolygon(buffer) {
    var sqTolerance = 2,
      len = buffer.length/2,
      markers = new Uint8Array(len),

      first = 0, last = len-1,

      i,
      maxSqDist,
      sqDist,
      index,
      firstStack = [], lastStack  = [],
      newBuffer  = [];

    markers[first] = markers[last] = 1;

    while (last) {
      maxSqDist = 0;
      for (i = first+1; i < last; i++) {
        sqDist = _getSquareSegmentDistance(
          buffer[i    *2], buffer[i    *2 + 1],
          buffer[first*2], buffer[first*2 + 1],
          buffer[last *2], buffer[last *2 + 1]
        );
        if (sqDist > maxSqDist) {
          index = i;
          maxSqDist = sqDist;
        }
      }

      if (maxSqDist > sqTolerance) {
        markers[index] = 1;

        firstStack.push(first);
        lastStack.push(index);

        firstStack.push(index);
        lastStack.push(last);
      }

      first = firstStack.pop();
      last = lastStack.pop();
    }

    for (i = 0; i < len; i++) {
      if (markers[i]) {
        newBuffer.push(buffer[i*2], buffer[i*2 + 1]);
      }
    }

    return newBuffer;
  }

  function _getCenter(buffer) {
    var len, x = 0, y = 0;
    for (var i = 0, il = buffer.length-3; i < il; i += 2) {
      x += buffer[i];
      y += buffer[i+1];
    }
    len = (buffer.length-2) / 2;
    return { x:x/len <<0, y:y/len <<0 };
  }

  function _getPixelFootprint(buffer) {
    var footprint = new Int32Array(buffer.length),
      px;

    for (var i = 0, il = buffer.length-1; i < il; i+=2) {
      px = geoToPixel(buffer[i], buffer[i+1]);
      footprint[i]   = px.x;
      footprint[i+1] = px.y;
    }

    footprint = _simplifyPolygon(footprint);
    if (footprint.length < 8) { // 3 points & end==start (*2)
      return;
    }

    return footprint;
  }

  function _createClosure(cacheKey) {
    return function(data) {
      var parsedData = _parse(data);
      Cache.add(parsedData, cacheKey);
      _addRenderItems(parsedData, true);
    };
  }

  function _parse(data) {
    if (!data) {
      return [];
    }
    if (data.type === 'FeatureCollection') {
      return readGeoJSON(data.features);
    }
    if (data.osm3s) { // XAPI
      return readOSMXAPI(data.elements);
    }
    return [];
  }

  function _resetItems() {
    renderItems = [];
    _currentItemsIndex = {};
  }

  function _addRenderItems(data, allAreNew) {
    var scaledItems = _scale(data, zoom),
      item;

    for (var i = 0, il = scaledItems.length; i < il; i++) {
      item = scaledItems[i];
      if (!_currentItemsIndex[item.id]) {
        item.scale = allAreNew ? 0 : 1;
        renderItems.push(item);
        _currentItemsIndex[item.id] = 1;
      }
    }
    fadeIn();
  }

  function _scale(items, zoom) {
    var i, il, j, jl,
      res = [],
      item,
      height, minHeight, footprint,
      color, wallColor, altColor,
      roofColor, roofHeight,
      holes, innerFootprint,
      zoomDelta = maxZoom-zoom,
      // TODO: move this to onZoom
      meterToPixel = 156412 / Math.pow(2, zoom) / 1.5; // http://wiki.openstreetmap.org/wiki/Zoom_levels, TODO: without factor 1.5, numbers don't match (lat/lon: Berlin)

    for (i = 0, il = items.length; i < il; i++) {
      item = items[i];

      height = item.height >>zoomDelta;

      minHeight = item.minHeight >>zoomDelta;
      if (minHeight > maxHeight) {
        continue;
      }

      if (!(footprint = _getPixelFootprint(item.footprint))) {
        continue;
      }

      holes = [];
      if (item.holes) {
        for (j = 0, jl = item.holes.length; j < jl; j++) {
          if ((innerFootprint = _getPixelFootprint(item.holes[j]))) {
            holes.push(innerFootprint);
          }
        }
      }

      wallColor = null;
      altColor  = null;
      if (item.wallColor) {
        if ((color = Color.parse(item.wallColor))) {
          wallColor = color.setAlpha(zoomAlpha);
          altColor  = ''+ wallColor.setLightness(0.8);
          wallColor = ''+ wallColor;
        }
      }

      roofColor = null;
      if (item.roofColor) {
        if ((color = Color.parse(item.roofColor))) {
          roofColor = ''+ color.setAlpha(zoomAlpha);
        }
      }

      roofHeight = item.roofHeight >>zoomDelta;

      // TODO: move buildings without height to FlatBuildings
      if (height <= minHeight && roofHeight <= 0) {
        continue;
      }

      res.push({
        id:         item.id,
        footprint:  footprint,
        height:     min(height, maxHeight),
        minHeight:  minHeight,
        wallColor:  wallColor,
        altColor:   altColor,
        roofColor:  roofColor,
        roofShape:  item.roofShape,
        roofHeight: roofHeight,
        center:     _getCenter(footprint),
        holes:      holes.length ? holes : null,
        shape:      item.shape, // TODO: drop footprint
        radius:     item.radius/meterToPixel
      });
    }

    return res;
  }

  var me = {};

  me.set = function(data) {
    _isStatic = true;
    _resetItems();
    _addRenderItems(_staticData = _parse(data), true);
  };

  me.load = function(url) {
    _url = url || OSM_XAPI_URL;
    _isStatic = !/(.+\{[nesw]\}){4,}/.test(_url);

    if (_isStatic) {
      _resetItems();
      xhr(_url, {}, function(data) {
        _addRenderItems(_staticData = _parse(data), true);
      });
      return;
    }

    me.update();
  };

  me.update = function() {
    _resetItems();

    if (zoom < MIN_ZOOM) {
      return;
    }

    if (_isStatic) {
      _addRenderItems(_staticData);
      return;
    }

    if (!_url) {
      return;
    }

    var lat, lon,
      parsedData, cacheKey,
      nw = pixelToGeo(originX,       originY),
      se = pixelToGeo(originX+width, originY+height),
      sizeLat = DATA_TILE_SIZE,
      sizeLon = DATA_TILE_SIZE*2;

    var bounds = {
      n: ceil( nw.latitude /sizeLat) * sizeLat,
      e: ceil( se.longitude/sizeLon) * sizeLon,
      s: floor(se.latitude /sizeLat) * sizeLat,
      w: floor(nw.longitude/sizeLon) * sizeLon
    };

    for (lat = bounds.s; lat <= bounds.n; lat += sizeLat) {
      for (lon = bounds.w; lon <= bounds.e; lon += sizeLon) {
        lat = _cropDecimals(lat);
        lon = _cropDecimals(lon);

        cacheKey = lat +','+ lon;
        if ((parsedData = Cache.get(cacheKey))) {
          _addRenderItems(parsedData);
        } else {
          xhr(_url, {
            n: _cropDecimals(lat+sizeLat),
            e: _cropDecimals(lon+sizeLon),
            s: lat,
            w: lon
          }, _createClosure(cacheKey));
        }
      }
    }

    Cache.purge();
  };

  return me;

}());
