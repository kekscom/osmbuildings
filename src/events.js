function onResize(e) {
    setSize(e.width, e.height);
    render();
    loadData();
}

function onMove(e) {
    setOrigin(e.x, e.y);
    render();
}

function onMoveEnd(e) {
    var nw = pixelToGeo(originX,         originY),
        se = pixelToGeo(originX + width, originY + height)
    ;
    shadows.render();
    render();
    // check, whether viewport is still within loaded data bounding box
    if (meta && (nw[LAT] > meta.n || nw[LON] < meta.w || se[LAT] < meta.s || se[LON] > meta.e)) {
        loadData();
    }
}

function onZoomStart(e) {
    isZooming = true;
    shadows.render();
    render(); // effectively clears because of isZooming flag
}

function onZoomEnd(e) {
    isZooming = false;
    setZoom(e.zoom);

    if (rawData) { // GeoJSON
        data = scaleData(rawData);
        render();
    } else {
        render();
        loadData();
    }
}
