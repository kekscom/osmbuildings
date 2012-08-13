        // private variables, specific to an instance
        var
            width = 0, height = 0,
            halfWidth = 0, halfHeight = 0,
            originX = 0, originY = 0,
            zoom, size,

            req,

            canvas, context,

            url,
            strokeRoofs,
            wallColor = new Color(200,190,180),
            roofColor = wallColor.adjustLightness(0.2),
            strokeColor = new Color(145,140,135),

            rawData,
            meta, data,

            zoomAlpha = 1,
            fadeFactor = 1,
            fadeTimer,

            maxZoom = 20,
            camX, camY,

            isZooming = false
        ;
