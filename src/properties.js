function setOrigin(origin) {
    originX = origin.x;
    originY = origin.y;
}

function setCamOffset(offset) {
    camX = halfWidth + offset.x;
    camY = height    + offset.y;
}

function setSize(size) {
    width  = size.w;
    height = size.h;
    halfWidth  = width /2 <<0;
    halfHeight = height/2 <<0;
    camX = halfWidth;
    camY = height;
    Layers.setSize(width, height);
    maxHeight = camZ-50;
}

function setZoom(z) {
    zoom = z;
    size = MAP_TILE_SIZE <<zoom;

    zoomAlpha = 1 - fromRange(zoom, minZoom, maxZoom, 0, 0.3);

    wallColorAlpha = defaultWallColor.setAlpha(zoomAlpha) + '';
    altColorAlpha  = defaultAltColor.setAlpha( zoomAlpha) + '';
    roofColorAlpha = defaultRoofColor.setAlpha(zoomAlpha) + '';
}

function setStyle(style) {
    style = style || {};
    if (style.color || style.wallColor) {
        defaultWallColor = Color.parse(style.color || style.wallColor);
        wallColorAlpha = defaultWallColor.setAlpha(zoomAlpha) + '';

        defaultAltColor = defaultWallColor.setLightness(0.8);
        altColorAlpha = defaultAltColor.setAlpha(zoomAlpha) + '';

        defaultRoofColor = defaultWallColor.setLightness(1.2);
        roofColorAlpha = defaultRoofColor.setAlpha(zoomAlpha) + '';
    }

    if (style.roofColor) {
        defaultRoofColor = Color.parse(style.roofColor);
        roofColorAlpha = defaultRoofColor.setAlpha(zoomAlpha) + '';
    }

    if (style.shadows !== undefined) {
        Shadows.enable(style.shadows);
    }

    renderAll();
}
