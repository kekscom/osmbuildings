function onResize(e) {
    setSize(e.width, e.height);
    renderAll();
    Data.update();
}

// TODO: cleanup, no engine is using that
function onMove(e) {
    setOrigin(e.x, e.y);
    render();
}

function onMoveEnd(e) {
    var nw = pixelToGeo(originX,       originY),
        se = pixelToGeo(originX+width, originY+height);
    renderAll();
    // check, whether viewport is still within loaded data bounding box
    if (nw[LAT] > Data.n || nw[LON] < Data.w || se[LAT] < Data.s || se[LON] > Data.e) {
        Data.update(); // => fadeIn() => renderAll()
    }
}

function onZoomStart(e) {
    isZooming = true;
    // effectively clears because of isZooming flag
    renderAll();
}

function onZoomEnd(e) {
    isZooming = false;
    setZoom(e.zoom); // => Data.scale()
    Data.update(); // => fadeIn()
    renderAll();
}
