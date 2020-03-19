
proto.style = function(style) {
  style = style || {};
  let color;
  if ((color = style.color || style.wallColor)) {
    WALL_COLOR = Color.parse(color);
    WALL_COLOR_STR = ''+ WALL_COLOR;

    ALT_COLOR = WALL_COLOR.lightness(0.8);
    ALT_COLOR_STR  = ''+ ALT_COLOR;

    ROOF_COLOR = WALL_COLOR.lightness(1.2);
    ROOF_COLOR_STR = ''+ ROOF_COLOR;
  }

  if (style.roofColor) {
    ROOF_COLOR = Color.parse(style.roofColor);
    ROOF_COLOR_STR = ''+ ROOF_COLOR;
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

let onEach = function() {};
proto.each = function(handler) {
  onEach = function(payload) {
    return handler(payload);
  };
  return this;
};

let onClick = function() {};

proto.click = function(handler) {
  onClick = function(payload) {
    return handler(payload);
  };
  return this;
};

osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;
