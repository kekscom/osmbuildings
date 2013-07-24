var osmb = function(bbox, size) {
//  maxZoom = 20; => which zoomlevel?
    zoom = maxZoom;

    setSize(size);
    var origin = geoToPixel(bbox.n, bbox.w);
    setOrigin(origin);
//    setZoom(zoom);

    Data.update();
    renderAll();
};

var proto = osmb.prototype;




function getZoom(bounds, size) {
    var zoom = 0,
        ne = bounds.getNorthEast(),
        sw = bounds.getSouthWest(),
        boundsSize,
        nePoint,
        swPoint,
        zoomNotFound = true;

    do {
        zoom++;
        nePoint = this.project(ne, zoom);
        swPoint = this.project(sw, zoom);

        boundsSize = new L.Point(
            Math.abs(nePoint.x - swPoint.x),
            Math.abs(swPoint.y - nePoint.y));

        zoomNotFound = boundsSize.x <= size.x && boundsSize.y <= size.y;
    } while (zoomNotFound);

    return zoom-1;
}