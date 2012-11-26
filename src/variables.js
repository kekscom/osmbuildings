        // private variables, specific to an instance
        var
            width = 0, height = 0,
            halfWidth = 0, halfHeight = 0,
            originX = 0, originY = 0,
            zoom, size,

            req,

            canvas, context,

            url,

            wallColor = new Color(200, 190, 180),
            altColor = wallColor.adjustLightness(0.8),
            roofColor = wallColor.adjustLightness(1.2),

            wallColorAlpha = wallColor + '',
            altColorAlpha  = altColor + '',
            roofColorAlpha = roofColor + '',

            rawData,
            meta, data,

            fadeFactor = 1, fadeTimer,

            minZoom = MIN_ZOOM,
            maxZoom = 20,
            camX, camY,

            isZooming
        ;
