var Data = {

  currentItemsIndex: {}, // maintain a list of cached items in order to avoid duplicates on tile borders

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

  createClosure: function(cacheKey) {
    var self = this;
    return function(data) {
      var parsedData = GeoJSON.read(data);
      Cache.add(parsedData, cacheKey);
      self.addRenderItems(parsedData, true);
    };
  },

  resetItems: function() {
    this.items = [];
    this.currentItemsIndex = {};
  },

  addRenderItems: function(data, allAreNew) {
    var item, scaledItem, id;
    for (var i = 0, il = data.length; i < il; i++) {
      item = data[i];
      id = item.id || [item.footprint[0], item.footprint[1], item.height, item.minHeight].join(',');
      if (!this.currentItemsIndex[id]) {
        if ((scaledItem = this.scale(item))) {
          scaledItem.scale = allAreNew ? 0 : 1;
          this.items.push(scaledItem);
          this.currentItemsIndex[id] = 1;
        }
      }
    }
    fadeIn();
  },

  scale: function(item) {
    var
      res = {},
      // TODO: calculate this on zoom change only
      zoomScale = 6 / pow(2, ZOOM-MIN_ZOOM); // TODO: consider using HEIGHT / (window.devicePixelRatio || 1)

    if (item.id) {
      res.id = item.id;
      res.hitColor = HitAreas.toColor(item.id);
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

    if (item.shape) {
      // TODO: drop footprint
      res.shape = item.shape;
      if (item.radius) {
        res.radius = item.radius/METERS_PER_PIXEL;
      }
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
      if ((color = parseColor(item.wallColor))) {
        color = color.alpha(ZOOM_FACTOR);
        res.altColor  = ''+ color.lightness(0.8);
        res.wallColor = ''+ color;
      }
    }

    if (item.roofColor) {
      if ((color = parseColor(item.roofColor))) {
        res.roofColor = ''+ color.alpha(ZOOM_FACTOR);
      }
    }

    if (item.roofHeight) {
      res.roofHeight = item.roofHeight/zoomScale;
    }

    if (res.height+res.roofHeight <= res.minHeight) {
      return;
    }

    if (item.roofShape) {
      res.roofShape = item.roofShape;
    }

    return res;
  },

  set: function(data) {
    this.isStatic = true;
    this.resetItems();
    this._staticData = GeoJSON.read(data);
    this.addRenderItems(this._staticData, true);
  },

  load: function(url) {
    this.url = template(url || DATA_URL, { k: DATA_KEY });
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

    if (!this.url) {
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
      x, y, coords,
      cacheKey, parsedData;

    for (y = minY; y <= maxY; y++) {
      for (x = minX; x <= maxX; x++) {
        coords = { x: x, y: y, z: tileZoom };
        cacheKey = x +','+ y;
        if ((parsedData = Cache.get(cacheKey))) {
          this.addRenderItems(parsedData);
				} else {
          xhr(template(this.url, coords), this.createClosure(cacheKey));
        }
      }
    }

    Cache.purge();
  }
};
