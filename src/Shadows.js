var Shadows = (function() {

    var _context;
    var _enabled = true;
    var _color = new Color(0, 0, 0);
    var _date = null;
    var _direction = { x:0, y:0 };

    function _project(x, y, h) {
        return {
            x: x + _direction.x*h,
            y: y + _direction.y*h
        };
    }

    function _cylinder(c, r, h, mh) {
        var _c = _project(c.x, c.y, h),
            a1, a2;

        if (mh) {
            c = _project(c.x, c.y, mh);
        }

        var t = getTangents(c, r, _c, r); // common tangents for ground and roof circle

        // no tangents? roof overlaps everything near cam position
        if (t) {
            a1 = atan2(t[0].y1-c.y, t[0].x1-c.x);
            a2 = atan2(t[1].y1-c.y, t[1].x1-c.x);

            _context.moveTo(t[1].x2, t[1].y2);
            _context.arc(_c.x, _c.y, r, a2, a1);
            _context.arc( c.x,  c.y, r, a1, a2);
        }
    }

    var me = {};

    me.setContext = function(context) {
        _context = context;
        // TODO: fix bad Date() syntax
        me.setDate(new Date().setHours(10)); // => render()
    };

    me.enable = function(flag) {
        _enabled = !!flag;
        // should call me.render() but it is usually set by setStyle() and there a renderAll() is called
    };

    me.render = function() {
        var center, sun, length, alpha, colorStr;

        _context.clearRect(0, 0, width, height);

        // show on high zoom levels only and avoid rendering during zoom
        if (!_enabled || zoom < minZoom || isZooming) {
            return;
        }

        // TODO: at some point, calculate me just on demand
        center = pixelToGeo(originX+halfWidth, originY+halfHeight);
        sun = getSunPosition(_date, center.latitude, center.longitude);

        if (sun.altitude <= 0) {
            return;
        }

        length = 1 / tan(sun.altitude);
        alpha = 0.4 / length;
        _direction.x = cos(sun.azimuth) * length;
        _direction.y = sin(sun.azimuth) * length;

        // TODO: maybe introduce Color.setAlpha()
        _color.a = alpha;
        colorStr = _color + '';

        var i, il, j, jl,
            item,
            f, h, mh,
            x, y,
            footprint,
            mode,
            isVisible,
            ax, ay, bx, by,
            a, b, _a, _b,
            points,
            specialItems = [],
            clipping = [];

        _context.fillStyle = colorStr;
        _context.beginPath();

        for (i = 0, il = renderItems.length; i < il; i++) {
            item = renderItems[i];

// TODO: no shadows when buildings are too flat => don't add them to renderItems then
//        if (item.height <= FlatBuildings.MAX_HEIGHT) {
//            continue;
//        }

            isVisible = false;
            f = item.footprint;
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]   = x = f[j]  -originX;
                footprint[j+1] = y = f[j+1]-originY;

                // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            // when fading in, use a dynamic height
            h = item.scale < 1 ? item.height*item.scale : item.height;

            mh = 0;
            if (item.minHeight) {
                mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
            }

            if (item.shape === 'cylinder') {
                if (item.roofShape === 'cylinder') {
                    h += item.roofHeight;
                }
                specialItems.push({
                    shape:item.shape,
                    center:{ x:item.center.x-originX, y:item.center.y-originY },
                    radius:item.radius,
                    h:h, mh:mh
                });
                continue;
            }

            mode = null;
            for (j = 0, jl = footprint.length-3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j+1];
                bx = footprint[j+2];
                by = footprint[j+3];

                _a = _project(ax, ay, h);
                _b = _project(bx, by, h);

                if (mh) {
                    a = _project(ax, ay, mh);
                    b = _project(bx, by, mh);
                    ax = a.x;
                    ay = a.y;
                    bx = b.x;
                    by = b.y;
                }

                // mode 0: floor edges, mode 1: roof edges
                if ((bx-ax) * (_a.y-ay) > (_a.x-ax) * (by-ay)) {
                    if (mode === 1) {
                        _context.lineTo(ax, ay);
                    }
                    mode = 0;
                    if (!j) {
                        _context.moveTo(ax, ay);
                    }
                    _context.lineTo(bx, by);
                } else {
                    if (mode === 0) {
                        _context.lineTo(_a.x, _a.y);
                    }
                    mode = 1;
                    if (!j) {
                        _context.moveTo(_a.x, _a.y);
                    }
                    _context.lineTo(_b.x, _b.y);
                }
            }

            if (!mh) {
                clipping.push(footprint);
            }
        }

        for (i = 0, il = specialItems.length; i < il; i++) {
            item = specialItems[i];
            if (item.shape === 'cylinder') {
                _cylinder(item.center, item.radius, item.h, item.mh);
            }
        }

        _context.fill();

        // now draw all the footprints as negative clipping mask
        _context.globalCompositeOperation = 'destination-out';
        _context.beginPath();
        for (i = 0, il = clipping.length; i < il; i++) {
            points = clipping[i];
            _context.moveTo(points[0], points[1]);
            for (j = 2, jl = points.length; j < jl; j += 2) {
                _context.lineTo(points[j], points[j+1]);
            }
            _context.lineTo(points[0], points[1]);
        }

        for (i = 0, il = specialItems.length; i < il; i++) {
            item = specialItems[i];
            if (item.shape === 'cylinder' && !item.mh) {
                _context.moveTo(item.center.x+item.radius, item.center.y);
                _context.arc(item.center.x, item.center.y, item.radius, 0, PI*2);
            }
        }

        _context.fillStyle = '#00ff00';
        _context.fill();
        _context.globalCompositeOperation = 'source-over';
    };

    me.setDate = function(date) {
        _date = date;
        me.render();
    };

    return me;

}());
