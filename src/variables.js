var
    VERSION = '0.1a',

    exp = Math.exp,
    log = Math.log,
    tan = Math.tan,
    atan = Math.atan,
    min = Math.min,
    max = Math.max,
    PI = Math.PI,
    HALF_PI = PI / 2,
    QUARTER_PI = PI / 4,
    RAD = 180 / PI,

    LAT = 'latitude', LON = 'longitude',
    HEIGHT = 0, FOOTPRINT = 1, COLOR = 2, IS_NEW = 3,

    // map values
    width = 0, height = 0,
    halfWidth = 0, halfHeight = 0,
    originX = 0, originY = 0,
    zoom, size,

    req,

    canvas, context,

    url,
    strokeRoofs,
    wallColor = 'rgb(200,190,180)',
    roofColor = adjustLightness(wallColor, 0.2),
    strokeColor = 'rgb(145,140,135)',

    rawData,
    meta, data,

    zoomAlpha = 1,
    fadeFactor = 1,
    fadeTimer,

    TILE_SIZE = 256,
    MIN_ZOOM = 14, MAX_ZOOM,

    CAM_X, CAM_Y, CAM_Z = 400,

    MAX_HEIGHT = CAM_Z - 50,

    isZooming = false
;
