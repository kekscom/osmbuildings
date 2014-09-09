
// TODO: remove deprecation
proto.setStyle = function(style) {
  console.warn('OSM Buildings: .setStyle() will be deprecated soon. Use .style() instead.');
  return this.style(style);
};

proto.style = function(style) {
  style = style || {};
  var color;
  if ((color = style.color || style.wallColor)) {
    WALL_COLOR = parseColor(color);
    WALL_COLOR_STR = ''+ WALL_COLOR.alpha(ZOOM_FACTOR);

    ALT_COLOR = WALL_COLOR.lightness(0.8);
    ALT_COLOR_STR  = ''+ ALT_COLOR.alpha(ZOOM_FACTOR);

    ROOF_COLOR = WALL_COLOR.lightness(1.2);
    ROOF_COLOR_STR = ''+ ROOF_COLOR.alpha(ZOOM_FACTOR);
  }

  if (style.roofColor) {
    ROOF_COLOR = parseColor(style.roofColor);
    ROOF_COLOR_STR = ''+ ROOF_COLOR.alpha(ZOOM_FACTOR);
  }

  if (style.shadows !== undefined) {
    Shadows.enabled = !!style.shadows;
  }

  Layers.render();

  return this;
};

// TODO: remove deprecation
proto.setDate = function(date) {
  console.warn('OSM Buildings: .setDate() will be deprecated soon. Use .date() instead.');
  return this.date(date);
};

proto.date = function(date) {
  Shadows.date = date;
  Shadows.render();
  return this;
};

// TODO: remove deprecation
proto.loadData = function(url) {
  console.warn('OSM Buildings: .loadData() will be deprecated soon. Use .load() instead.');
  return this.load(url);
};

proto.load = function(url) {
  Data.load(url);
  return this;
};

// TODO: remove deprecation
proto.setData = function(data) {
  console.warn('OSM Buildings: .setData() will be deprecated soon. Use .data() instead.');
  return this.set(data);
};

proto.set = function(data) {
  Data.set(data);
  return this;
};

proto.screenshot = function(forceDownload) {
  var dataURL = Layers.screenshot();
  if (forceDownload) {
    global.location.href = dataURL.replace('image/png', 'image/octet-stream');
  }
  return dataURL;
};

var onEach = function() {};

proto.each = function(handler, scope) {
  onEach = function(payload) {
    return handler.call(scope, payload);
  };
  return this;
};

var onClick = function() {};

proto.click = function(handler, scope) {
  onClick = function(payload) {
    return handler.call(scope, payload);
  };
  return this;
};

osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;
