var FlatBuildings = (function() {

    var _context;

    var me = {};

    me.MAX_HEIGHT = 8;
    me.USE_COLORS = false;

    me.setContext = function(context) {
        _context = context;
    };

    me.render = function() {
        _context.clearRect(0, 0, width, height);

        // show on high zoom levels only and avoid rendering during zoom
        if (zoom < minZoom || isZooming) {
            return;
        }

        var i, il, j, jl,
            item,
            f,
            x, y,
            footprint,
            isVisible,
            ax, ay;

        if (!me.USE_COLORS) _context.beginPath();

        for (i = 0, il = renderItems.length; i < il; i++) {
            item = renderItems[i];

            if (item.height+item.roofHeight > me.MAX_HEIGHT) {
                continue;
            }

            isVisible = false;
            f = item.footprint;
            footprint = [];
            for (j = 0, jl = f.length-1; j < jl; j += 2) {
                footprint[j]   = x = f[j]  -originX;
                footprint[j+1] = y = f[j+1]-originY;

                // checking footprint is sufficient for visibility
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            if (me.USE_COLORS) _context.beginPath();

            for (j = 0, jl = footprint.length-3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];
                if (!j) {
                    _context.moveTo(ax, ay);
                } else {
                    _context.lineTo(ax, ay);
                }
            }

            _context.closePath();

            if (me.USE_COLORS) {
                _context.fillStyle   = item.roofColor || roofColorAlpha;
                _context.strokeStyle = item.altColor || altColorAlpha;

                _context.stroke();
                _context.fill();
            }
        }

        if (!me.USE_COLORS) {
            _context.fillStyle   = roofColorAlpha;
            _context.strokeStyle = altColorAlpha;

            _context.stroke();
            _context.fill();
        }
    };

    return me;

}());
