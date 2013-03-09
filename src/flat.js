var flat = {
    enabled: true,
    canvas: null,
    context: null,
    maxHeight: 8,

    init: function (container) {
        this.canvas = createCanvas(container);
        this.canvas.id = 'flat';
        this.context = this.canvas.getContext('2d');
    },

    render: function () {
        var context = this.context;

        context.clearRect(0, 0, width, height);

        if (!this.enabled ||
            // data needed for rendering
            !meta || !data ||
            // show on high zoom levels only and avoid rendering during zoom
            zoom < minZoom || isZooming) {
            return;
        }

        var i, il, j, jl,
            item,
            f, m,
            x, y,
            offX = originX - meta.x,
            offY = originY - meta.y,
            footprint,
            isVisible,
            ax, ay, _a
        ;

        // precalculating projection height scale
        m = camZ / (camZ - this.maxHeight);

        context.beginPath();

        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];

            if (item[HEIGHT] > this.maxHeight) {
                continue;
            }

            isVisible = false;
            f = item[FOOTPRINT];
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]     = x = (f[j]     - offX);
                footprint[j + 1] = y = (f[j + 1] - offY);

                // checking footprint is sufficient for visibility
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];

                // project 3d to 2d on extruded footprint
                _a = project(ax, ay, m);
                if (!j) {
                    context.moveTo(_a.x, _a.y);
                } else {
                    context.lineTo(_a.x, _a.y);
                }
            }

            context.closePath();
        }

        context.fillStyle   = item[RENDER_COLOR][2] || roofColorAlpha;
        context.strokeStyle = item[RENDER_COLOR][1] || altColorAlpha;

        context.stroke();
        context.fill();
    },

    // TODO: footprints could be kept internally, but drawing order matters. So shadows is providing them for now.
    renderWalls: function (context, footprints) {
        if (!this.enabled) {
            return;
        }

        var points,
            i, il,
            j, jl;

        // draw footprints in order to simulate walls
        context.beginPath();
        for (i = 0, il = footprints.length; i < il; i++) {
            points = footprints[i];
            context.moveTo(points[0], points[1]);
            for (j = 2, jl = points.length; j < jl; j += 2) {
                context.lineTo(points[j], points[j + 1]);
            }
            context.lineTo(points[0], points[1]);
            context.closePath();
        }
        context.fillStyle = wallColorAlpha;
        context.fill();
    },

    setSize: function (w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
    }
};
