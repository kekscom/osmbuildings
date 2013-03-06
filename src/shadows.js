var shadows = {
    enabled: true,
    canvas: null,
    context: null,
    color: new Color(0, 0, 0),
    colorStr: this.color + '',
    alpha: 1,
    length: 0,
    directionX: 0,
    directionY: 0,

    init: function (container) {
        this.canvas = createCanvas(container);
        this.context = this.canvas.getContext('2d');
    },

    render: function () {
        var context = this.context;

        context.clearRect(0, 0, width, height);

        if (!this.enabled) {
            return;
        }

        if (!meta || !data) {
            return;
        }

        if (zoom < minZoom || isZooming) {
            return;
        }

        if (!this.length) {
            return;
        }

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
            grounds = []
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

            // TODO: check, whether this works
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

            grounds.push(footprint);
        }

        context.fillStyle = this.colorStr;
        context.fill();

        // now draw all the footprints as negative clipping mask
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        var points;
        for (i = 0, il = grounds.length; i < il; i++) {
            points = grounds[i];
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

    setAlpha: function(alpha) {
        this.colorStr = this.color.adjustAlpha(alpha) + '';
        this.render();
    },

    setEnabled: function (flag) {
        this.enabled = !!flag;
        this.render();
    },

    setSun: function (sun) {
        if (sun.altitude <= 0) {
            this.length = 0;
            this.alpha = fromRange(-sun.altitude, 0, 1, 0.2, 0.7);
        } else {
            this.length = 1 / tan(sun.altitude);
            this.alpha = 0.4 / this.length;
            this.directionX = cos(sun.azimuth) * this.length;
            this.directionY = sin(sun.azimuth) * this.length;
        }

        this.color.a = this.alpha;
        this.colorStr = this.color + '';

        this.render();
    },

    setSize: function (w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
    },

    destroy: function () {
        this.canvas.parentNode.removeChild(this.canvas);
    }
};