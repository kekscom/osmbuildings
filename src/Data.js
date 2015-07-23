
var Data = {

  loadedItems: {}, // maintain a list of cached items in order to avoid duplicates on tile borders
  items: [],

  getPixelFootprint: function(buffer) {
    var footprint = new Int32Array(buffer.length),
      px;

    for (var i = 0, il = buffer.length-1; i < il; i+=2) {
      px = geoToPixel(buffer[i], buffer[i+1]);
      footprint[i]   = px.x;
      footprint[i+1] = px.y;
    }

    footprint = simplifyPolygon(footprint);
    if (footprint.length < 8) { // 3 points & end==start (*2)
      return;
    }

    return footprint;
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
      id = item.id || [item.footprint[0], item.footprint[1], item.height, item.minHeight].join(',');
      if (!this.loadedItems[id]) {
        if ((scaledItem = this.scale(item))) {
          scaledItem.scale = allAreNew ? 0 : 1;
          this.items.push(scaledItem);
          this.loadedItems[id] = 1;
        }
      }
    }
    fadeIn();
  },

  scale: function(item) {
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

    res.footprint = this.getPixelFootprint(item.footprint);
    if (!res.footprint) {
      return;
    }
    res.center = getCenter(res.footprint);

    if (item.radius) {
      res.radius = item.radius*PIXEL_PER_DEG;
    }
    if (item.shape) {
      res.shape = item.shape;
    }
    if (item.roofShape) {
      res.roofShape = item.roofShape;
    }
    if ((res.roofShape === 'cone' || res.roofShape === 'dome') && !res.shape && isRotational(res.footprint)) {
      res.shape = 'cylinder';
    }

    if (item.holes) {
      res.holes = [];
      var innerFootprint;
      for (var i = 0, il = item.holes.length; i < il; i++) {
        // TODO: simplify
        if ((innerFootprint = this.getPixelFootprint(item.holes[i]))) {
          res.holes.push(innerFootprint);
        }
      }
    }

    var color;

    if (item.wallColor) {
      if ((color = Color.parse(item.wallColor))) {
        color = color.alpha(ZOOM_FACTOR);
        res.altColor  = ''+ color.lightness(0.8);
        res.wallColor = ''+ color;
      }
    }

    if (item.roofColor) {
      if ((color = Color.parse(item.roofColor))) {
        res.roofColor = ''+ color.alpha(ZOOM_FACTOR);
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
    return Request.loadJSON(url, callback);
  }
};
