var VERSION      = /*<version=*/'0.1.9a'/*>*/,
  ATTRIBUTION  = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',
  OSM_XAPI_URL = 'http://overpass-api.de/api/interpreter?data=[out:json];(way[%22building%22]({s},{w},{n},{e});node(w);way[%22building:part%22=%22yes%22]({s},{w},{n},{e});node(w);relation[%22building%22]({s},{w},{n},{e});way(r);node(w););out;',
//OSM_XAPI_URL = 'http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];(way[%22building%22]({s},{w},{n},{e});node(w);way[%22building:part%22=%22yes%22]({s},{w},{n},{e});node(w);relation[%22building%22]({s},{w},{n},{e});way(r);node(w););out;',

  PI         = Math.PI,
  HALF_PI    = PI/2,
  QUARTER_PI = PI/4,
  RAD        = 180/PI,

  MAP_TILE_SIZE  = 256,    // map tile size in pixels
  DATA_TILE_SIZE = 0.0075, // data tile size in geo coordinates, smaller: less data to load but more requests

  MIN_ZOOM = 15,

  LAT = 'latitude', LON = 'longitude',

  TRUE = true, FALSE = false,

  WIDTH = 0, HEIGHT = 0,
  CENTER_X = 0, CENTER_Y = 0,
  ORIGIN_X = 0, ORIGIN_Y = 0,
  ZOOM, size,

  activeRequest,

  defaultWallColor = parseColor('rgba(200, 190, 180)'),
  defaultAltColor  = defaultWallColor.lightness(0.8),
  defaultRoofColor = defaultWallColor.lightness(1.2),

  wallColorAlpha = ''+ defaultWallColor,
  altColorAlpha  = ''+ defaultAltColor,
  roofColorAlpha = ''+ defaultRoofColor,

  fadeFactor = 1,
  animTimer,

  METERS_PER_PIXEL = 1,
  ZOOM_FACTOR = 1,

  MAX_HEIGHT, // taller buildings will be cut to this
  DEFAULT_HEIGHT = 5,

  CAM_X, CAM_Y, CAM_Z = 450,

  isZooming;
