// private variables, specific to an instance
var width = 0, height = 0,
    halfWidth = 0, halfHeight = 0,
    originX = 0, originY = 0,
    zoom, size,

    activeRequest,

    context,

    defaultWallColor = new Color(200, 190, 180),
    defaultAltColor  = defaultWallColor.setLightness(0.8),
    defaultRoofColor = defaultWallColor.setLightness(1.2),

    wallColorAlpha = defaultWallColor + '',
    altColorAlpha  = defaultAltColor + '',
    roofColorAlpha = defaultRoofColor + '',

    fadeFactor = 1,
    animTimer,
    zoomAlpha = 1,

    minZoom = MIN_ZOOM,
    maxZoom = 20,
    maxHeight,

    camX, camY, camZ = 450,

    isZooming;
