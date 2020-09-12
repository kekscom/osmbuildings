
class Data {

  static getPixelFootprint (buffer) {
    let footprint = new Int32Array(buffer.length),
      px;

    for (let i = 0, il = buffer.length-1; i < il; i+=2) {
      px = geoToPixel(buffer[i], buffer[i+1]);
      footprint[i]   = px.x;
      footprint[i+1] = px.y;
    }

    footprint = simplifyPolygon(footprint);
    if (footprint.length < 8) { // 3 points & end==start (*2)
      return;
    }

    return footprint;
  }

  static resetItems () {
    this.items = [];
    this.cache = {};
    Picking.reset();
  }

  static addRenderItems (data, allAreNew) {
    let item, scaledItem, id;
    let geojson = GeoJSON.read(data);
    for (let i = 0, il = geojson.length; i < il; i++) {
      item = geojson[i];
      id = item.id || [item.footprint[0], item.footprint[1], item.height, item.minHeight].join(',');
      if (!this.cache[id]) {
        if ((scaledItem = this.scaleItem(item))) {
          scaledItem.scale = allAreNew ? 0 : 1;
          this.items.push(scaledItem);
          this.cache[id] = 1;
        }
      }
    }
    fadeIn();
  }

  static scalePolygon (buffer, factor) {
    return buffer.map(coord => coord*factor);
  }

  static scale (factor) {
    Data.items = Data.items.map(item => {
      // item.height = Math.min(item.height*factor, MAX_HEIGHT); // TODO: should be filtered by renderer

      item.height *= factor;
      item.minHeight *= factor;

      item.footprint = Data.scalePolygon(item.footprint, factor);
      item.center.x *= factor;
      item.center.y *= factor;

      if (item.radius) {
        item.radius *= factor;
      }

      if (item.holes) {
        for (let i = 0, il = item.holes.length; i < il; i++) {
          item.holes[i] = Data.scalePolygon(item.holes[i], factor);
        }
      }

      item.roofHeight *= factor;

      return item;
    });
  }

  static scaleItem (item) {
    let
      res = {},
      // TODO: calculate this on zoom change only
      zoomScale = 6 / pow(2, ZOOM-MIN_ZOOM); // TODO: consider using HEIGHT / (devicePixelRatio || 1)

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
      let innerFootprint;
      for (let i = 0, il = item.holes.length; i < il; i++) {
        // TODO: simplify
        if ((innerFootprint = this.getPixelFootprint(item.holes[i]))) {
          res.holes.push(innerFootprint);
        }
      }
    }

    let color;

    if (item.wallColor) {
      if ((color = Qolor.parse(item.wallColor))) {
        res.altColor  = ''+ color.lightness(0.8);
        res.wallColor = ''+ color;
      }
    }

    if (item.roofColor) {
      if ((color = Qolor.parse(item.roofColor))) {
        res.roofColor = ''+ color;
      }
    }

    if (item.relationId) {
      res.relationId = item.relationId;
    }
    res.hitColor = Picking.idToColor(item.relationId || item.id);

    res.roofHeight = isNaN(item.roofHeight) ? 0 : item.roofHeight/zoomScale;

    if (res.height+res.roofHeight <= res.minHeight) {
      return;
    }

    return res;
  }

  static set (data) {
    this.resetItems();
    this._staticData = data;
    this.addRenderItems(this._staticData, true);
  }

  static load (src, key) {
    this.src = src || DATA_SRC.replace('{k}', (key || 'anonymous'));
    this.update();
  }

  static update () {
    this.resetItems();

    if (ZOOM < MIN_ZOOM) {
      return;
    }

    if (this._staticData) {
      this.addRenderItems(this._staticData);
    }

    if (this.src) {
      let
        tileZoom = 16,
        tileSize = 256,
        zoomedTileSize = ZOOM > tileZoom ? tileSize << (ZOOM - tileZoom) : tileSize >> (tileZoom - ZOOM),
        minX = ORIGIN_X / zoomedTileSize << 0,
        minY = ORIGIN_Y / zoomedTileSize << 0,
        maxX = ceil((ORIGIN_X + WIDTH) / zoomedTileSize),
        maxY = ceil((ORIGIN_Y + HEIGHT) / zoomedTileSize),
        x, y;

      let scope = this;

      function callback (json) {
        scope.addRenderItems(json);
      }

      for (y = minY; y <= maxY; y++) {
        for (x = minX; x <= maxX; x++) {
          this.loadTile(x, y, tileZoom, callback);
        }
      }
    }
  }

  static loadTile (x, y, zoom, callback) {
    let s = 'abcd'[(x+y) % 4];
    let url = this.src.replace('{s}', s).replace('{x}', x).replace('{y}', y).replace('{z}', zoom);
    return Request.loadJSON(url, callback);
  }
}

Data.cache = {}; // maintain a list of cached items in order to avoid duplicates on tile borders
Data.items = [];
