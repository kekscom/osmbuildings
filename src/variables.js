// private variables, specific to an instance
var width = 0, height = 0,
    halfWidth = 0, halfHeight = 0,
    originX = 0, originY = 0,
    zoom, size,

    activeRequest,

    context,

    wallColor = new Color(200, 190, 180),
    altColor  = wallColor.setLightness(0.8),
    roofColor = wallColor.setLightness(1.2),

    wallColorAlpha = wallColor + '',
    altColorAlpha  = altColor + '',
    roofColorAlpha = roofColor + '',

    fadeFactor = 1, fadeTimer,
    zoomAlpha = 1,

    minZoom = MIN_ZOOM,
    maxZoom = 20,
    maxHeight,

    camX, camY, camZ,

    isZooming;
