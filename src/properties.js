        function setSize(w, h) {
            width  = w;
            height = h;
            halfWidth  = width / 2 << 0;
            halfHeight = height / 2 << 0;
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
            var i, il, j,
                alpha,
                item
            ;

            zoom = z;
            size = TILE_SIZE << zoom;

            alpha = 1 - (zoom - minZoom) * 0.3 / (maxZoom - minZoom);

            updateColorAlpha();

            if (data) {
                for (i = 0, il = data.length; i < il; i++) {
                    item = data[i];
                    item[RENDERCOLOR] = [];
                    for (j = 0; j < 3; j++) {
                        if (item[COLOR][j]) {
                            item[RENDERCOLOR][j] = item[COLOR][j].adjustAlpha(alpha) + '';
                        }
                    }
                }
            }
        }

        function setCam(x, y) {
            camX = x;
            camY = y;
        }

        function setStyle(style) {
            style = style || {};
            if (style.color || style.wallColor) {
                wallColor = Color.parse(style.color || style.wallColor);
                altColor = wallColor.adjustLightness(0.8);
                roofColor = wallColor.adjustLightness(1.2);
            }
            if (style.roofColor) {
                roofColor = Color.parse(style.roofColor);
            }

            updateColorAlpha();
            render();
        }

        function updateColorAlpha() {
            var alpha = 1 - (zoom - minZoom) * 0.3 / (maxZoom - minZoom);
            wallColorAlpha = wallColor.adjustAlpha(alpha) + '';
            altColorAlpha  = altColor.adjustAlpha(alpha) + '';
            roofColorAlpha = roofColor.adjustAlpha(alpha) + '';
        }
