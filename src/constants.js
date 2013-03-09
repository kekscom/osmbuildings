// constants, shared to all instances
var VERSION = /*<version=*/'0.1.8a'/*>*/,
    ATTRIBUTION = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',

    PI = Math.PI,
    HALF_PI = PI / 2,
    QUARTER_PI = PI / 4,
    RAD = 180 / PI,

    TILE_SIZE = 256,
    MIN_ZOOM = 14, // for buildings data only, GeoJSON should not be affected

    LAT = 'latitude', LON = 'longitude',

//  HEIGHT = 0, FOOTPRINT = 1, COLOR = 2, CENTER = 3, IS_NEW = 4, RENDER_COLOR = 5, MIN_HEIGHT = 6;
    HEIGHT = 0, MIN_HEIGHT = 1, FOOTPRINT = 2, COLOR = 3, CENTER = 4, IS_NEW = 5, RENDER_COLOR = 6;
