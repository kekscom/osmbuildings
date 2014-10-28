
proto.style = function(style) {
  style = style || {};
  var color;
  if ((color = style.color || style.wallColor)) {
    WALL_COLOR = Color.parse(color);
    WALL_COLOR_STR = ''+ WALL_COLOR.alpha(ZOOM_FACTOR);

    ALT_COLOR = WALL_COLOR.lightness(0.8);
    ALT_COLOR_STR  = ''+ ALT_COLOR.alpha(ZOOM_FACTOR);

    ROOF_COLOR = WALL_COLOR.lightness(1.2);
    ROOF_COLOR_STR = ''+ ROOF_COLOR.alpha(ZOOM_FACTOR);
  }

  if (style.roofColor) {
    ROOF_COLOR = Color.parse(style.roofColor);
    ROOF_COLOR_STR = ''+ ROOF_COLOR.alpha(ZOOM_FACTOR);
  }

  if (style.shadows !== undefined) {
    Shadows.enabled = !!style.shadows;
  }

  Layers.render();

  return this;
};

proto.date = function(date) {
  Shadows.date = date;
  Shadows.render();
  return this;
};

proto.load = function(url) {
  Data.load(url);
  return this;
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

proto.each = function(handler) {
  onEach = function(payload) {
    return handler(payload);
  };
  return this;
};

var onClick = function() {};

proto.click = function(handler) {
  onClick = function(payload) {
    return handler(payload);
  };
  return this;
};

proto.getDetails = function(id, handler) {
  if (Data.provider) {
    Data.provider.getFeature(id, handler);
  }
  return this;
};

osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;
