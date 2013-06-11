function setSize(w, h) {
    width  = w;
    height = h;
    halfWidth  = width /2 <<0;
    halfHeight = height/2 <<0;
    camX = halfWidth;
    camY = height;
    camZ = width / (1.5 / (window.devicePixelRatio || 1)) / tan(90/2) <<0; // adapting cam pos to field of view (90°), 1.5 is an empirical correction factor
    Layers.setSize(width, height);
    // TODO: change of maxHeight needs to adjust building heights!
    maxHeight = camZ-50;
}

function setOrigin(x, y) {
    originX = x;
    originY = y;
}

function setZoom(z) {
    zoom = z;
    size = MAP_TILE_SIZE <<zoom;

    zoomAlpha = 1 - fromRange(zoom, minZoom, maxZoom, 0, 0.3);

    wallColorAlpha = wallColor.setAlpha(zoomAlpha) + '';
    altColorAlpha  = altColor.setAlpha( zoomAlpha) + '';
    roofColorAlpha = roofColor.setAlpha(zoomAlpha) + '';
}

function setCam(x, y) {
    camX = x;
    camY = y;
}

function setStyle(style) {
    style = style || {};
    if (style.color || style.wallColor) {
        wallColor = Color.parse(style.color || style.wallColor);
        wallColorAlpha = wallColor.setAlpha(zoomAlpha) + '';

        altColor = wallColor.setLightness(0.8);
        altColorAlpha = altColor.setAlpha(zoomAlpha) + '';

        roofColor = wallColor.setLightness(1.2);
        roofColorAlpha = roofColor.setAlpha(zoomAlpha) + '';
    }

    if (style.roofColor) {
        roofColor = Color.parse(style.roofColor);
        roofColorAlpha = roofColor.setAlpha(zoomAlpha) + '';
    }

    if (style.shadows !== undefined) {
        Shadows.enable(style.shadows);
    }

    renderAll();
}
