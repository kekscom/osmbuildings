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
    renderAll();
    Data.update(); // => fadeIn() => renderAll()
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
