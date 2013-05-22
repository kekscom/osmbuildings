// constants, shared to all instances
var VERSION = /*<version=*/'0.1.8a'/*>*/,
    ATTRIBUTION = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',

    PI = Math.PI,
    HALF_PI = PI/2,
    QUARTER_PI = PI/4,
    RAD = 180/PI,

    TILE_SIZE = 256,
    MIN_ZOOM = 14, // TODO: for buildings data only, GeoJSON should not be affected

    LAT = 'latitude', LON = 'longitude',

    DEFAULT_HEIGHT = 5;
