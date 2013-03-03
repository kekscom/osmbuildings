var shadows = {
    enabled: true,
    originX: 0,
    originY: 0,
    buffer: new Image(),
    color: new Color(0, 0, 0),
    colorStr: this.color + '',
    sunAlpha: 1,
    length: 0,
    directionX: 0,
    directionY: 0,

    create: function () {
        if (!meta || !data) {
            return;
        }

        if (!this.length) {
            return;
        }

        this.originX = originX;
        this.originY = originY;

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

        context.fillStyle = this.colorStr;

        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];

            isVisible = false;
            f = item[FOOTPRINT];
            footprint = []; // typed array would be created each pass and is way too slow
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]     = x = (f[j]     - offX);
                footprint[j + 1] = y = (f[j + 1] - offY);

                // TODO: checking footprint is sufficient for visibility - NOT ANYMORE!
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            // TODO: check, whether this works
            // when fading in, use a dynamic height
            //h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];
            h = item[HEIGHT];

            // prepare same calculations for min_height if applicable
            if (item[MIN_HEIGHT]) {
                //h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
                h = item[MIN_HEIGHT];
            }

            mode = null;
            context.beginPath();

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
            context.fill();

            grounds.push(footprint);
        }

        // draw all footprints in a different color for later filtering
        context.fillStyle = wallColorAlpha;
        for (i = 0, il = grounds.length; i < il; i++) {
            drawShape(grounds[i]);
        }

        this.filter();
        this.buffer.src = canvas.toDataURL();
    },

    project: function (x, y, h) {
        return {
            x: x + this.directionX * h,
            y: y + this.directionY * h
        };
    },

    filter: function () {
        var buffer = context.getImageData(0, 0, width, height),
            pixels = buffer.data,
            blendAlpha = this.sunAlpha * 255 <<0,
            maxAlpha = 255,
            r, a;

        for (var i = 0, il = pixels.length; i < il; i += 4) {
            r = pixels[i + 0];
            a = pixels[i + 3];
            // make everything with color and maximum alpha fully transparent
            if (r && a >= maxAlpha) {
                pixels[i + 3] = 0;
            } else
            // reduce higher alpha values to max shadow color alpha
            // this removes dark overlapping areas in shadows but keeps all anti aliasing
            if (a > blendAlpha) {
                pixels[i + 3] = blendAlpha;
            }
        }

        context.putImageData(buffer, 0, 0);
    },

    render: function () {
        if (!this.length) {
            return;
        }
        context.drawImage(this.buffer, this.originX-originX, this.originY-originY);
    },

    setSun: function (sun) {
        if (sun.altitude <= 0) {
            this.length = 0;
            this.sunAlpha = fromRange(-sun.altitude, 0, 1, 0.2, 0.7);
        } else {
            this.length = 1 / tan(sun.altitude);
            this.sunAlpha = 0.4 / this.length;
            this.directionX = cos(sun.azimuth) * this.length;
            this.directionY = sin(sun.azimuth) * this.length;
        }

        this.color.a = this.sunAlpha;
        this.colorStr = this.color + '';

        this.create();
    }
};