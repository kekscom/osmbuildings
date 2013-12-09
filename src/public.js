proto.setStyle = function(style) {
  style = style || {};
  if (style.color || style.wallColor) {
    defaultWallColor = Color.parse(style.color || style.wallColor);
    wallColorAlpha   = ''+ defaultWallColor.setAlpha(zoomAlpha);

    defaultAltColor  = defaultWallColor.setLightness(0.8);
    altColorAlpha    = ''+ defaultAltColor.setAlpha(zoomAlpha);

    defaultRoofColor = defaultWallColor.setLightness(1.2);
    roofColorAlpha   = ''+ defaultRoofColor.setAlpha(zoomAlpha);
  }

  if (style.roofColor) {
    defaultRoofColor = Color.parse(style.roofColor);
    roofColorAlpha   = ''+ defaultRoofColor.setAlpha(zoomAlpha);
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
