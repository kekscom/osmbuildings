// private variables, specific to an instance
var
  WIDTH = 0, HEIGHT = 0, // though this looks like a constant it's needed for distinguishing from local vars
  HALF_WIDTH = 0, HALF_HEIGHT = 0,
  originX = 0, originY = 0,
  zoom, size,

  activeRequest,

  defaultWallColor = parseColor('rgba(200, 190, 180)'),
  defaultAltColor  = defaultWallColor.lightness(0.8),
  defaultRoofColor = defaultWallColor.lightness(1.2),

  wallColorAlpha = ''+ defaultWallColor,
  altColorAlpha  = ''+ defaultAltColor,
  roofColorAlpha = ''+ defaultRoofColor,

  fadeFactor = 1,
  animTimer,
  ZOOM_ALPHA = 1,

  minZoom = MIN_ZOOM,
  maxZoom = 20,
  maxHeight,

  camX, camY, camZ = 450,

  isZooming;
