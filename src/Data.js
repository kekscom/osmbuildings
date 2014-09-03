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
    var scaledItems = this.scale(data);
    for (var i = 0, il = scaledItems.length; i < il; i++) {
      if (!this.currentItemsIndex[scaledItems[i].id]) {
        scaledItems[i].scale = allAreNew ? 0 : 1;
        this.items.push(scaledItems[i]);
        this.currentItemsIndex[scaledItems[i].id] = 1;
      }
    }
    fadeIn();
  },

  scale: function(items) {
    var i, il, j, jl,
      res = [],
      item,
      height, minHeight, footprint,
      color, wallColor, altColor,
      roofColor, roofHeight,
      holes, innerFootprint,
      zoomScale = 6 / pow(2, ZOOM-MIN_ZOOM); // TODO: consider using HEIGHT / (window.devicePixelRatio || 1)

    for (i = 0, il = items.length; i < il; i++) {
      item = items[i];

      height = item.height / zoomScale;

      minHeight = isNaN(item.minHeight) ? 0 : item.minHeight / zoomScale;
      if (minHeight > MAX_HEIGHT) {
        continue;
      }

      if (!(footprint = this.getPixelFootprint(item.footprint))) {
        continue;
      }

      holes = [];
      if (item.holes) {
        // TODO: simplify
        for (j = 0, jl = item.holes.length; j < jl; j++) {
          if ((innerFootprint = this.getPixelFootprint(item.holes[j]))) {
            holes.push(innerFootprint);
          }
        }
      }

      wallColor = null;
      altColor  = null;
      if (item.wallColor) {
        if ((color = parseColor(item.wallColor))) {
          wallColor = color.alpha(ZOOM_FACTOR);
          altColor  = ''+ wallColor.lightness(0.8);
          wallColor = ''+ wallColor;
      }
    }

      roofColor = null;
      if (item.roofColor) {
        if ((color = parseColor(item.roofColor))) {
          roofColor = ''+ color.alpha(ZOOM_FACTOR);
        }
      }

      roofHeight = item.roofHeight / zoomScale;

      if (height <= minHeight && roofHeight <= 0) {
        continue;
      }

      res.push({
        id:         item.id,
        footprint:  footprint,
        height:     min(height, MAX_HEIGHT),
        minHeight:  minHeight,
        wallColor:  wallColor,
        altColor:   altColor,
        roofColor:  roofColor,
        roofShape:  item.roofShape,
        roofHeight: roofHeight,
        center:     getCenter(footprint),
        holes:      holes.length ? holes : null,
        shape:      item.shape, // TODO: drop footprint
        radius:     item.radius/METERS_PER_PIXEL,
        hitColor:   HitAreas.toColor(item.id)
      });
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

    if (this.isStatic) {
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
