        function setSize(w, h) {
            width = w;
            height = h;
            halfWidth  = ~~(width / 2);
            halfHeight = ~~(height / 2);
            camX = halfWidth;
            camY = height;
            canvas.width = width;
            canvas.height = height;
        }

        function setOrigin(x, y) {
            originX = x;
            originY = y;
        }

        function setZoom(z) {
            zoom = z;
            size = TILE_SIZE << zoom;
            // maxAlpha - (zoom-MIN_ZOOM) * (maxAlpha-minAlpha) / (maxZoom-MIN_ZOOM)
            zoomAlpha = 1 - (zoom - MIN_ZOOM) * 0.3 / (maxZoom - MIN_ZOOM);
        }

        function setStyle(style) {
            style = style || {};
            strokeRoofs = style.strokeRoofs !== undefined ? style.strokeRoofs : strokeRoofs;
            if (style.fillColor) {
                wallColor = Color.parse(style.fillColor);
                roofColor = wallColor.adjustLightness(0.2);
            }
            render();
        }
