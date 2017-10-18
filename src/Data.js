
var Data = {

  loadedItems: {}, // maintain a list of cached items in order to avoid duplicates
  items: [],

  projectGeometry: function(geometry) {
    return geometry.map(function(polygon) {
      return polygon.map(function(point) {
        return project(point[0], point[1]);
      });
      return simplifyPolygon(polygon);
    });
  },

  resetItems: function() {
    this.items = [];
    this.loadedItems = {};
    HitAreas.reset();
  },

  addRenderItems: function(data, allAreNew) {
    var item, scaledItem, id;
    var geojson = GeoJSON.read(data);
    for (var i = 0, il = geojson.length; i < il; i++) {
      item = geojson[i];
      id = item.id || [item.geometry[0][0], item.geometry[0][1], item.height, item.minHeight].join(',');
      if (!this.loadedItems[id]) {
        if ((scaledItem = this.scaleItem(item))) {
          scaledItem.scale = allAreNew ? 0 : 1;
          this.items.push(scaledItem);
          this.loadedItems[id] = 1;
        }
      }
    }
    fadeIn();
  },

  scaleGeometry: function(geometry, factor) {
    return geometry.map(function(polygon) {
      return polygon.map(function(point) {
        return [
          point[0] * factor,
          point[1] * factor
        ];
      });
    });
  },

  scale: function(factor) {
    Data.items = Data.items.map(function(item) {
      // item.height = Math.min(item.height*factor, MAX_HEIGHT); // TODO: should be filtered by renderer

      item.height *= factor;
      item.minHeight *= factor;

      item.geometry = Data.scaleGeometry(item.geometry, factor);
      item.center[0] *= factor;
      item.center[1] *= factor;

      if (item.radius) {
        item.radius *= factor;
      }

      item.roofHeight *= factor;

      return item;
    });
  },

  scaleItem: function(item) {
    var
      res = {},
      // TODO: calculate this on zoom change only
      zoomScale = 6 / pow(2, ZOOM-MIN_ZOOM); // TODO: consider using HEIGHT / (global.devicePixelRatio || 1)

    if (item.id) {
      res.id = item.id;
    }

    res.height = min(item.height/zoomScale, MAX_HEIGHT);

    res.minHeight = isNaN(item.minHeight) ? 0 : item.minHeight / zoomScale;
    if (res.minHeight > MAX_HEIGHT) {
      return;
    }

    res.geometry = Data.projectGeometry(item.geometry);
    if (res.geometry[0].length < 4) { // 3 points & end==start (*2)
      return;
    }
    res.center = getCenter(res.geometry[0]);

    if (item.radius) {
      res.radius = item.radius*PIXEL_PER_DEG;
    }
    if (item.shape) {
      res.shape = item.shape;
    }
    if (item.roofShape) {
      res.roofShape = item.roofShape;
    }
    if ((res.roofShape === 'cone' || res.roofShape === 'dome') && !res.shape && isRotational(res.geometry[0])) {
      res.shape = 'cylinder';
    }

    var color;

    if (item.wallColor) {
      if ((color = Color.parse(item.wallColor))) {
        res.altColor  = ''+ color.lightness(0.8);
        res.wallColor = ''+ color;
      }
    }

    if (item.roofColor) {
      if ((color = Color.parse(item.roofColor))) {
        res.roofColor = ''+ color;
      }
    }

    if (item.relationId) {
      res.relationId = item.relationId;
    }
    res.hitColor = HitAreas.idToColor(item.relationId || item.id);

    res.roofHeight = isNaN(item.roofHeight) ? 0 : item.roofHeight/zoomScale;

    if (res.height+res.roofHeight <= res.minHeight) {
      return;
    }

    return res;
  },

  set: function(data) {
    this.isStatic = true;
    this.resetItems();
    this._staticData = data;
    this.addRenderItems(this._staticData, true);
  },

  load: function(src, key) {
    this.src = src || DATA_SRC.replace('{k}', (key || 'anonymous'));
    this.update();
  },

  update: function() {
    this.resetItems();

    if (ZOOM < MIN_ZOOM) {
      return;
    }

    if (this.isStatic && this._staticData) {
      this.addRenderItems(this._staticData);
      return;
    }

    if (!this.src) {
      return;
    }

    var
      tileZoom = 16,
      tileSize = 256,
      zoomedTileSize = ZOOM > tileZoom ? tileSize <<(ZOOM-tileZoom) : tileSize >>(tileZoom-ZOOM),
      minX = ORIGIN_X/zoomedTileSize <<0,
      minY = ORIGIN_Y/zoomedTileSize <<0,
      maxX = ceil((ORIGIN_X+WIDTH) /zoomedTileSize),
      maxY = ceil((ORIGIN_Y+HEIGHT)/zoomedTileSize),
      x, y;

    var scope = this;
    function callback(json) {
      scope.addRenderItems(json);
    }

    for (y = minY; y <= maxY; y++) {
      for (x = minX; x <= maxX; x++) {
        this.loadTile(x, y, tileZoom, callback);
      }
    }
  },
  
  loadTile: function(x, y, zoom, callback) {
    var s = 'abcd'[(x+y) % 4];
    var url = this.src.replace('{s}', s).replace('{x}', x).replace('{y}', y).replace('{z}', zoom);
    return ajax(url, callback);
  }
};
