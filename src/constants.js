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

    // import keys
    // TODO: use meta info
    DATA_HEIGHT = 0, DATA_MIN_HEIGHT = 1, DATA_FOOTPRINT = 2, DATA_COLOR = 3, DATA_ROOF_COLOR = 4,

    // converted & render keys
    // TODO: cleanup
    HEIGHT = 0, MIN_HEIGHT = 1, FOOTPRINT = 2, COLOR = 3, CENTER = 4, IS_NEW = 5, RENDER_COLOR = 6;
