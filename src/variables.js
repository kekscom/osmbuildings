// private variables, specific to an instance
var width = 0, height = 0,
    halfWidth = 0, halfHeight = 0,
    originX = 0, originY = 0,
    zoom, size,

    req,

    context,

    url,

    rawData,
    meta, data, renderData,

    wallColor = new Color(200, 190, 180),
    altColor = wallColor.adjustLightness(0.8),
    roofColor = wallColor.adjustLightness(1.2),
    //red: roofColor = new Color(240, 200, 180),
    //green: roofColor = new Color(210, 240, 220),

    wallColorAlpha = wallColor + '',
    altColorAlpha  = altColor + '',
    roofColorAlpha = roofColor + '',

    rawData,
    meta, data,

    fadeFactor = 1, fadeTimer,
    zoomAlpha = 1,

    minZoom = MIN_ZOOM,
    maxZoom = 20,
    maxHeight,

    camX, camY, camZ,

    isZooming;

var materialColors = {
    brick: '#cc7755',
    bronze: '#ffeecc',
    canvas: '#fff8f0',
    concrete: '#999999',
    copper: '#a0e0d0',
    glass: '#e8f8f8',
    gold: '#ffcc00',
    grass: '#009933',
    metal: '#aaaaaa',
    panel: '#fff8f0',
    plaster: '#999999',
    roof_tiles: '#f08060',
    silver: '#cccccc',
    slate: '#666666',
    stone: '#996666',
    tar_paper: '#333333',
    wood: '#deb887'
};
