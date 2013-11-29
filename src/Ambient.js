var Ambient = (function() {

    var _context;
    var _enabled = true;

    var me = {};

    me.setContext = function(context) {
        _context = context;
    };

    me.enable = function(flag) {
        _enabled = !!flag;
        // should call me.render() but it is usually set by setStyle() and there a renderAll() is called
    };

    me.render = function() {
        _context.clearRect(0, 0, width, height);
        _render();
    };

    var _render = function() {
        //_context.clearRect(0, 0, width, height);

        // show on high zoom levels only and avoid rendering during zoom
        if (!_enabled || zoom < minZoom || isZooming) {
            return;
        }

        var i, il, j, jl,
            item,
            f, mh,
            x, y,
            blurSize = 20,
            footprint,
            isVisible,
            bbox = { minX:-blurSize, minY:-blurSize, maxX:width+blurSize, maxY:height+blurSize };


        _context.shadowColor = '#000000';
        _context.strokeStyle = '#999999';
        _context.shadowBlur = blurSize;

        _context.beginPath();

        for (i = 0, il = renderItems.length; i < il; i++) {
            item = renderItems[i];

// TODO: no shadows when buildings are too flat => don't add them to renderItems then
//          if (item.height <= FlatBuildings.MAX_HEIGHT) {
//              continue;
//          }

            isVisible = false;
            f = item.footprint;
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]   = x = f[j]  -originX;
                footprint[j+1] = y = f[j+1]-originY;

                // TODO: checking footprint is sufficient for visibility - add blur size as grace area!!!
                if (!isVisible) {
                    isVisible = (x > bbox.minX && x < bbox.maxX && y > bbox.minY && y < bbox.maxY);
                }
            }

            if (!isVisible) {
                continue;
            }

            mh = 0;
            if (item.minHeight) {
//              mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
            }

            if (mh) {
              continue;
            }

            if (item.shape === 'cylinder') {
//              center:{ x:item.center.x-originX, y:item.center.y-originY },
//              _context.moveTo(item.center.x+item.radius, item.center.y);
//              _context.arc(item.center.x, item.center.y, item.radius, 0, PI*2);
              continue;
            }

            _context.moveTo(footprint[0], footprint[1]);
            for (j = 2, jl = footprint.length; j < jl; j += 2) {
                _context.lineTo(footprint[j], footprint[j+1]);
            }
            _context.lineTo(footprint[0], footprint[1]);
         }

        _context.stroke();

        _context.shadowBlur = null;

        _context.globalCompositeOperation = 'destination-out';
        _context.beginPath();

        for (i = 0, il = renderItems.length; i < il; i++) {
            item = renderItems[i];

// TODO: no shadows when buildings are too flat => don't add them to renderItems then
//          if (item.height <= FlatBuildings.MAX_HEIGHT) {
//              continue;
//          }

            isVisible = false;
            f = item.footprint;
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]   = x = f[j]  -originX;
                footprint[j+1] = y = f[j+1]-originY;

                // TODO: checking footprint is sufficient for visibility - add blur size as grace area!!!
                if (!isVisible) {
                    isVisible = (x > bbox.minX && x < bbox.maxX && y > bbox.minY && y < bbox.maxY);
                }
            }

            if (!isVisible) {
                continue;
            }

            mh = 0;
            if (item.minHeight) {
//              mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
            }

            if (mh) {
              continue;
            }

            if (item.shape === 'cylinder') {
//              center:{ x:item.center.x-originX, y:item.center.y-originY },
//              _context.moveTo(item.center.x+item.radius, item.center.y);
//              _context.arc(item.center.x, item.center.y, item.radius, 0, PI*2);
              continue;
            }

            _context.moveTo(footprint[0], footprint[1]);
            for (j = 2, jl = footprint.length; j < jl; j += 2) {
                _context.lineTo(footprint[j], footprint[j+1]);
            }
            _context.lineTo(footprint[0], footprint[1]);
         }

        _context.fillStyle = '#00ff00';
        _context.fill();
        _context.globalCompositeOperation = 'source-over';
    };

    return me;

}());
