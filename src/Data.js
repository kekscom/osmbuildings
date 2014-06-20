var Data = {

  currentItemsIndex: {}, // maintain a list of cached items in order to avoid duplicates on tile borders

  items: [],

  cropDecimals: function(num) {
    return parseFloat(num.toFixed(5));
  },

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
      var parsedData = self.parse(data);
      Cache.add(parsedData, cacheKey);
      self.addRenderItems(parsedData, true);
    };
  },

  parse: function(data) {
    if (!data) {
      return [];
    }
    if (data.type === 'FeatureCollection') {
      return importGeoJSON(data.features, this.each);
    }
    if (data.osm3s) { // OSM Overpass
      return importOSM(data.elements, this.each);
    }
    return [];
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
        radius:     item.radius/METERS_PER_PIXEL
      });
    }

    return res;
  },

  set: function(data) {
    this.isStatic = true;
    this.resetItems();
    this.addRenderItems(this.staticData = this.parse(data), true);
  },

  load: function(url) {
    this.url = url || OSM_XAPI_URL;
    this.isStatic = !/(.+\{[nesw]\}){4,}/.test(this.url);

    if (this.isStatic) {
      this.resetItems();
      xhr(this.url, {}, function(data) {
        this.addRenderItems(this.staticData = this.parse(data), true);
      });
      return;
    }

    this.update();
  },

  update: function() {
    this.resetItems();

    if (ZOOM < MIN_ZOOM) {
      return;
    }

    if (this.isStatic) {
      this.addRenderItems(this.staticData);
      return;
    }

    if (!this.url) {
      return;
    }

    var lat, lon,
      parsedData, cacheKey,
      nw = pixelToGeo(ORIGIN_X,       ORIGIN_Y),
      se = pixelToGeo(ORIGIN_X+WIDTH, ORIGIN_Y+HEIGHT),
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
        lat = this.cropDecimals(lat);
        lon = this.cropDecimals(lon);

        cacheKey = lat +','+ lon;
        if ((parsedData = Cache.get(cacheKey))) {
          this.addRenderItems(parsedData);
        } else {
          xhr(this.url, {
            n: this.cropDecimals(lat+sizeLat),
            e: this.cropDecimals(lon+sizeLon),
            s: lat,
            w: lon
          }, this.createClosure(cacheKey));
        }
      }
    }

    Cache.purge();
  },

  each: function() {}

};
