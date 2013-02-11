        function fadeIn() {
            fadeFactor = 0;
            clearInterval(fadeTimer);
            fadeTimer = setInterval(function () {
                fadeFactor += 0.5 * 0.2; // amount * easing
                if (fadeFactor > 1) {
                    clearInterval(fadeTimer);
                    fadeFactor = 1;
                    // unset 'already present' marker
                    for (var i = 0, il = data.length; i < il; i++) {
                        data[i][IS_NEW] = 0;
                    }
                }
                render();
            }, 33);
        }

        var sunX, sunY, sunZ;

        function createShadows() {
            var i, il, j, jl,
                item,
                f, h, m, n,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                footprint, grounds = [],
                mode,
                isVisible,
                ax, ay, bx, by,
                a, b, _a, _b
            ;

            context.fillStyle = shadowColorAlpha;

            var dateTime = new Date('2013-02-09 08:30:00'),
                center = pixelToGeo(originX + halfWidth, originY + halfHeight),
                sunPos = getSunPosition(dateTime, center.latitude, center.longitude);

            // console.log(sunPos.azimuth * RAD + 180, sunPos.altitude * RAD);

            if (sunPos.altitude < 0) {
                context.fillRect(0, 0, width, height);
                return;
            }

            sunX = camX;
            sunY = 50000;
            sunZ = 2 * sunY * Math.tan(sunPos.altitude);

            for (i = 0, il = data.length; i < il; i++) {
                item = data[i];

                isVisible = false;
                f = item[FOOTPRINT];
                footprint = []; // typed array would be created each pass and is way too slow
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

                // when fading in, use a dynamic height
                h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];
                // precalculating projection height scale
                m = sunZ / (sunZ - h);

                // prepare same calculations for min_height if applicable
                if (item[MIN_HEIGHT]) {
                    h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
                    n = sunZ / (sunZ - h);
                }

                mode = null;
                context.beginPath();

                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    bx = footprint[j + 2];
                    by = footprint[j + 3];

                    _a = projectShadow(ax, ay, m);
                    _b = projectShadow(bx, by, m);

                    if (item[MIN_HEIGHT]) {
                        a = projectShadow(ax, ay, n);
                        b = projectShadow(bx, by, n);
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

                var g = [];
                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    g[j]     = ax;
                    g[j + 1] = ay;
                }
                grounds.push(g);
            }

            context.fillStyle = 'rgb(250,240,230)';
            for (i = 0, il = grounds.length; i < il; i++) {
                drawShape(grounds[i]);
            }
        }

        var shadowBuffer = new Image();
        var bufferIsFilled = false;

        function renderShadows() {
            if (!bufferIsFilled) {
                createShadows();
                var imgData = context.getImageData(0, 0, width, height);
                var r, g, a;
                for (var i = 0, il = imgData.data.length; i < il; i+= 4) {
                    r = imgData.data[i + 0];
                    g = imgData.data[i + 1];
                    a = imgData.data[i + 3];
                    if (r > g) {
                        imgData.data[i + 3] = 256 - a;
                    } else
                    if (a) {
                        imgData.data[i + 3] = 0.2 * 256;
                    }

                }
                context.putImageData(imgData, 0, 0);

                shadowBuffer.src = canvas.toDataURL();
                bufferIsFilled = true;
                return;
            }
            context.drawImage(shadowBuffer, 0, 0, width, height);
        }


        function projectShadow(x, y, m) {
            return {
                x: (x - sunX) * m + sunX,
                y: (y - sunY) * m + sunY
            };
        }

        function render() {
            context.clearRect(0, 0, width, height);

            // data needed for rendering
            if (!meta || !data) {
                return;
            }

            // show buildings in high zoom levels only
            // avoid rendering during zoom
            if (zoom < minZoom || isZooming) {
                return;
            }

            if (shadows) {
                renderShadows();
            }

            var i, il, j, jl,
                item,
                f, h, m, n,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                sortCam = [camX + offX, camY + offY],
                footprint, roof,
                isVisible,
                ax, ay, bx, by,
                a, b, _a, _b
            ;

            data.sort(function (a, b) {
                return distance(b[CENTER], sortCam) / b[HEIGHT] - distance(a[CENTER], sortCam) / a[HEIGHT];
            });

            for (i = 0, il = data.length; i < il; i++) {
                item = data[i];

                isVisible = false;
                f = item[FOOTPRINT];
                footprint = []; // typed array would be created each pass and is way too slow
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

                // when fading in, use a dynamic height
                h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];
                // precalculating projection height scale
                m = camZ / (camZ - h);

                // prepare same calculations for min_height if applicable
                if (item[MIN_HEIGHT]) {
                    h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
                    n = camZ / (camZ - h);
                }

                roof = []; // typed array would be created each pass and is way too slow

                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    bx = footprint[j + 2];
                    by = footprint[j + 3];

                    // project 3d to 2d on extruded footprint
                    _a = project(ax, ay, m);
                    _b = project(bx, by, m);

                    if (item[MIN_HEIGHT]) {
                        a = project(ax, ay, n);
                        b = project(bx, by, n);
                        ax = a.x;
                        ay = a.y;
                        bx = b.x;
                        by = b.y;
                    }

                    // backface culling check
                    if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                        // depending on direction, set wall shading
                        if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                            context.fillStyle = item[RENDER_COLOR][1] || altColorAlpha;
                        } else {
                            context.fillStyle = item[RENDER_COLOR][0] || wallColorAlpha;
                        }

                        drawShape([
                            bx, by,
                            ax, ay,
                            _a.x, _a.y,
                            _b.x, _b.y
                        ]);
                    }
                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }

                // fill roof and optionally stroke it
                context.fillStyle   = item[RENDER_COLOR][2] || roofColorAlpha;
                context.strokeStyle = item[RENDER_COLOR][1] || altColorAlpha;
                drawShape(roof, true);
            }
        }

        function debugMarker(x, y, color, size) {
            context.fillStyle = color || '#ffcc00';
            context.beginPath();
            context.arc(x, y, size || 3, 0, PI * 2, true);
            context.closePath();
            context.fill();
        }

        function drawShape(points, stroke) {
            if (!points.length) {
                return;
            }

            context.beginPath();
            context.moveTo(points[0], points[1]);
            for (var i = 2, il = points.length; i < il; i += 2) {
                context.lineTo(points[i], points[i + 1]);
            }
            context.closePath();
            if (stroke) {
                context.stroke();
            }
            context.fill();
        }

        function project(x, y, m) {
            return {
                x: ((x - camX) * m + camX << 0),
                y: ((y - camY) * m + camY << 0)
            };
        }
