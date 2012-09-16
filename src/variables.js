
    // object access shortcuts
    var
        Int32Array = Int32Array || Array,
        exp = Math.exp,
        log = Math.log,
        tan = Math.tan,
        atan = Math.atan,
        min = Math.min,
        max = Math.max,
        sqrt = Math.sqrt,
        abs = Math.abs,
        doc = global.document
    ;

    // private constants, shared to all instances
    var
        VERSION = /*<version=*/'0.1.6a'/*>*/,

        PI = Math.PI,
        HALF_PI = PI / 2,
        QUARTER_PI = PI / 4,
        RAD = 180 / PI,

        TILE_SIZE = 256,
        MIN_ZOOM = 14, // for buildings data only, GeoJSON should not be affected

        CAM_Z = 400,
        MAX_HEIGHT = CAM_Z - 50,

        LAT = 'latitude', LON = 'longitude',
        HEIGHT = 0, FOOTPRINT = 1, COLOR = 2, CENTER = 3, IS_NEW = 4
    ;

    // private variables, specific to an instance
    var
        osmb = this,

        width = 0, height = 0,
        halfWidth = 0, halfHeight = 0,
        originX = 0, originY = 0,
        zoom, size,

        req,

        canvas, context,

        url,
        strokeRoofs,
        wallColor = new Color(200,190,180),
        roofColor = null,
        strokeColor = new Color(145,140,135),

        rawData,
        meta, data,

        zoomAlpha = 1,
        fadeFactor = 1,
        fadeTimer,

        minZoom = MIN_ZOOM,
        maxZoom = 20,
        camX, camY,

        isZooming = false
    ;
