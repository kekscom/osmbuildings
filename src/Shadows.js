var Shadows = {

    context: null,
    color: new Color(0, 0, 0),
    colorStr: this.color + '',
    date: null,
    alpha: 1,
    length: 0,
    directionX: 0,
    directionY: 0,

    init: function (context) {
        this.context = context;
        this.setDate(new Date().setHours(10)); // => render()
    },

    render: function () {
        var context = this.context,
            center, sun, length, alpha, colorStr;

        context.clearRect(0, 0, width, height);

        // data needed for rendering
        if (!meta || !data ||
            // show on high zoom levels only and avoid rendering during zoom
            zoom < minZoom || isZooming) {
            return;
        }

        // TODO: at some point, calculate this just on demand
        center = pixelToGeo(originX + halfWidth, originY + halfHeight);
        sun = getSunPosition(this.date, center.latitude, center.longitude);

        if (sun.altitude <= 0) {
            return;
        }

        length = 1 / tan(sun.altitude);
        alpha = 0.4 / length;
        this.directionX = cos(sun.azimuth) * length;
        this.directionY = sin(sun.azimuth) * length;

        // TODO: maybe introduce Color.setAlpha()
        this.color.a = alpha;
        colorStr = this.color + '';

        var i, il, j, jl,
            item,
            f, h,
            x, y,
            offX = originX - meta.x,
            offY = originY - meta.y,
            footprint,
            mode,
            isVisible,
            ax, ay, bx, by,
            a, b, _a, _b,
            points,
            allFootprints = []
        ;

        context.beginPath();

        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];

            isVisible = false;
            f = item[FOOTPRINT];
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]     = x = (f[j]     - offX);
                footprint[j + 1] = y = (f[j + 1] - offY);

                // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            // when fading in, use a dynamic height
            h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];

            // prepare same calculations for min_height if applicable
            if (item[MIN_HEIGHT]) {
                h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
            }

            mode = null;

            for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];
                bx = footprint[j + 2];
                by = footprint[j + 3];

                _a = this.project(ax, ay, h);
                _b = this.project(bx, by, h);

                if (item[MIN_HEIGHT]) {
                    a = this.project(ax, ay, h);
                    b = this.project(bx, by, h);
                    ax = a.x;
                    ay = a.y;
                    bx = b.x;
                    by = b.y;
                }

                if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                    if (mode === 1) {
                        context.lineTo(ax, ay);
                    }
                    mode = 0;
                    if (!j) {
                        context.moveTo(ax, ay);
                    }
                    context.lineTo(bx, by);
                } else {
                    if (mode === 0) {
                        context.lineTo(_a.x, _a.y);
                    }
                    mode = 1;
                    if (!j) {
                        context.moveTo(_a.x, _a.y);
                    }
                    context.lineTo(_b.x, _b.y);
                }
            }

            context.closePath();

            allFootprints.push(footprint);
        }

        context.fillStyle = colorStr;
        context.fill();

        // now draw all the footprints as negative clipping mask
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        for (i = 0, il = allFootprints.length; i < il; i++) {
            points = allFootprints[i];
            context.moveTo(points[0], points[1]);
            for (j = 2, jl = points.length; j < jl; j += 2) {
                context.lineTo(points[j], points[j + 1]);
            }
            context.lineTo(points[0], points[1]);
            context.closePath();
        }
        context.fillStyle = '#00ff00';
        context.fill();
        context.globalCompositeOperation = 'source-over';
    },

    project: function (x, y, h) {
        return {
            x: x + this.directionX * h,
            y: y + this.directionY * h
        };
    },

    setDate: function(date) {
        this.date = date;
        this.render();
    }
};