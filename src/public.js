proto.setStyle = function(style) {
  style = style || {};
  var color;
  if ((color = style.color || style.wallColor)) {
    defaultWallColor = parseColor(color);
    wallColorAlpha   = ''+ defaultWallColor.alpha(ZOOM_ALPHA);

    defaultAltColor  = defaultWallColor.lightness(0.8);
    altColorAlpha    = ''+ defaultAltColor.alpha(ZOOM_ALPHA);

    defaultRoofColor = defaultWallColor.lightness(1.2);
    roofColorAlpha   = ''+ defaultRoofColor.alpha(ZOOM_ALPHA);
  }

  if (style.roofColor) {
    defaultRoofColor = parseColor(style.roofColor);
    roofColorAlpha   = ''+ defaultRoofColor.alpha(ZOOM_ALPHA);
  }

  if (style.shadows !== undefined) {
    Shadows.enabled = !!style.shadows;
  }

  Layers.render();

  return this;
};

proto.setDate = function(date) {
  Shadows.date = date;
  Shadows.render();
  return this;
};

proto.loadData = function(url) {
  Data.load(url);
  return this;
};

proto.setData = function(data) {
  Data.set(data);
  return this;
};

proto.each = function(handler, scope) {
  Data.each = function(feature) {
    return handler.call(scope, feature);
  };
  return this;
};

osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;
