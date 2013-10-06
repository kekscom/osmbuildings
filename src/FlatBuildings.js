var FlatBuildings = (function() {

    var _context;

    var me = {};

    me.MAX_HEIGHT = 8;

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
            isVisible;

        _context.beginPath();

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

            _context.moveTo(footprint[0], footprint[1]);
            for (j = 2, jl = footprint.length-3; j < jl; j += 2) {
              _context.lineTo(footprint[j], footprint[j+1]);
            }

            _context.closePath();
        }

        _context.fillStyle   = roofColorAlpha;
        _context.strokeStyle = altColorAlpha;

        _context.stroke();
        _context.fill();
    };

    return me;

}());
