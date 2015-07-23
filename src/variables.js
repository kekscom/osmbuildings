var
  VERSION      = /*<version=*/'0.2.3b'/*>*/,
  ATTRIBUTION  = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',

  DATA_SRC = 'http://{s}.data.osmbuildings.org/0.2/{k}/tile/{z}/{x}/{y}.json',

  PI         = Math.PI,
  HALF_PI    = PI/2,
  QUARTER_PI = PI/4,

  MAP_TILE_SIZE  = 256,    // map tile size in pixels
  DATA_TILE_SIZE = 0.0075, // data tile size in geo coordinates, smaller: less data to load but more requests
  ZOOM, MAP_SIZE,

  MIN_ZOOM = 15,

  LAT = 'latitude', LON = 'longitude',

  TRUE = true, FALSE = false,

  WIDTH = 0, HEIGHT = 0,
  CENTER_X = 0, CENTER_Y = 0,
  ORIGIN_X = 0, ORIGIN_Y = 0,

  WALL_COLOR = Color.parse('rgba(200, 190, 180)'),
  ALT_COLOR  = WALL_COLOR.lightness(0.8),
  ROOF_COLOR = WALL_COLOR.lightness(1.2),

  WALL_COLOR_STR = ''+ WALL_COLOR,
  ALT_COLOR_STR  = ''+ ALT_COLOR,
  ROOF_COLOR_STR = ''+ ROOF_COLOR,

  PIXEL_PER_DEG = 0,
  ZOOM_FACTOR = 1,

  MAX_HEIGHT, // taller buildings will be cut to this
  DEFAULT_HEIGHT = 5,

  CAM_X, CAM_Y, CAM_Z = 450,

  isZooming;
