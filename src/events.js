function onResize(e) {
    setSize(e.width, e.height);
    renderAll();
    loadData();
}

// TODO: cleanup, no engine is using that
function onMove(e) {
    setOrigin(e.x, e.y);
    render();
}

function onMoveEnd(e) {
    var nw = pixelToGeo(originX,         originY),
        se = pixelToGeo(originX + width, originY + height)
    ;
    renderAll();
    // check, whether viewport is still within loaded data bounding box
    if (meta && (nw[LAT] > meta.n || nw[LON] < meta.w || se[LAT] < meta.s || se[LON] > meta.e)) {
        loadData(); // => fadeIn() => renderAll()
    }
}

function onZoomStart(e) {
    isZooming = true;
    // effectively clears because of isZooming flag
    renderAll();
}

function onZoomEnd(e) {
    isZooming = false;
    setZoom(e.zoom);

    if (rawData) { // GeoJSON
        data = scaleData(rawData);
        renderAll();
    } else {
        render();
        loadData(); // => fadeIn() => renderAll()
    }
}
