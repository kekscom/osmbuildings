function setSize(w, h) {
    width  = w;
    height = h;
    halfWidth  = width /2 <<0;
    halfHeight = height/2 <<0;
    camX = halfWidth;
    camY = height;
    camZ = width / (1.5 / (window.devicePixelRatio || 1)) / tan(90 / 2) <<0; // adapting cam pos to field of view (90°), 1.5 is an empirical correction factor
    Layers.setSize(width, height);
    // TODO: change of maxHeight needs to adjust building heights!
    maxHeight = camZ - 50;
}

function setOrigin(x, y) {
    originX = x;
    originY = y;
}

function setZoom(z) {
    var i, il, j,
        item
    ;

    zoom = z;
    size = TILE_SIZE << zoom;

    zoomAlpha = 1 - fromRange(zoom, minZoom, maxZoom, 0, 0.4);

    wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '';
    altColorAlpha  = altColor.adjustAlpha(zoomAlpha) + '';
    roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';

    if (data) {
        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];
            item[RENDER_COLOR] = [];
            for (j = 0; j < 3; j++) {
                if (item[COLOR][j]) {
                    item[RENDER_COLOR][j] = item[COLOR][j].adjustAlpha(zoomAlpha) + '';
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
        wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '';

        altColor = wallColor.adjustLightness(0.8);
        altColorAlpha = altColor.adjustAlpha(zoomAlpha) + '';

        roofColor = wallColor.adjustLightness(1.2);
        roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';
    }

    if (style.roofColor) {
        roofColor = Color.parse(style.roofColor);
        roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';
    }

    renderAll();
}
