// constants, shared to all instances
var VERSION      = /*<version=*/'0.1.8a'/*>*/,
    ATTRIBUTION  = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',
    OSM_XAPI_URL = 'http://overpass-api.de/api/interpreter?data=[out:json];(way[%22building%22](52.405,13.35,52.410,13.4);node(w);way[%22building:part%22=%22yes%22](52.405,13.35,52.410,13.4);node(w);relation[%22building%22](52.405,13.35,52.410,13.4);way(r);node(w););out;&jsonp={callback}'

    PI         = Math.PI,
    HALF_PI    = PI/2,
    QUARTER_PI = PI/4,
    RAD        = 180/PI,

    TILE_SIZE = 256,
    MIN_ZOOM = 14, // TODO: for buildings data only, GeoJSON should not be affected

    LAT = 'latitude', LON = 'longitude',

    DEFAULT_HEIGHT = 5;
