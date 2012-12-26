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


        function renderX() {
            context.globalCompositeOperation = 'darker';
            context.clearRect(0, 0, width, height);
context.fillStyle = 'rgba(240,235,230,0.75)';
context.fillRect(0, 0, width, height);

            // data needed for rendering
            if (!meta || !data) {
                return;
            }

            // show buildings in high zoom levels only
            // avoid rendering during zoom
            if (zoom < minZoom || isZooming) {
                return;
            }

            var
                i, il, j, jl,
                item,
                f,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                sortCam = [camX + offX, camY + offY],
                footprint,
                isVisible
            ;

            data.sort(function (a, b) {
                return distance(b[CENTER], sortCam) / b[HEIGHT] * 0.5 - distance(a[CENTER], sortCam) / a[HEIGHT] * 0.5 ;
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

//ra = 0.7 * g1 + 0.3 * b1;
//ga = g2;
//ba = b2;

                camX += 10;
                wallColorAlpha = new Color(222, 190, 180, 0.5).adjustLightness(0.8) + '';
                altColorAlpha  = new Color(212, 152, 136, 0.5).adjustLightness(0.6) + '';
                roofColorAlpha = new Color(232, 228, 223, 0.5).adjustLightness(0.9) + '';
                drawBuilding(item, footprint);


                camX -= 20;
                wallColorAlpha = new Color(187, 224, 217, 0.2).adjustLightness(1.4) + '';
                altColorAlpha  = new Color(147, 214, 206, 0.5).adjustLightness(1.1) + '';
                roofColorAlpha = new Color(226, 233, 228, 0.5).adjustLightness(1.1) + '';
                drawBuilding(item, footprint);

//
//                camX += 20;
//                wallColorAlpha = new Color(222, 190, 180, 0.5) + '';
//                altColorAlpha  = new Color(212, 152, 136, 0.5) + '';
//                roofColorAlpha = new Color(232, 228, 223, 0.5) + '';
//                drawBuilding(item, footprint);

                camX += 10;
            }
        }

        function drawBuilding(item, footprint) {
            var
                j, jl,
                h, m,
                roof, walls,
                ax, ay, bx, by, _a, _b
            ;

            // when fading in, use a dynamic height
            h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];

            // precalculating projection height scale
            m = CAM_Z / (CAM_Z - h);

            roof = []; // typed array would be created each pass and is way too slow
            walls = [];

            for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];
                bx = footprint[j + 2];
                by = footprint[j + 3];

                // project 3d to 2d on extruded footprint
                _a = project(ax, ay, m);
                _b = project(bx, by, m);

                // backface culling check
                if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                    walls = [
                        bx + 0.5, by + 0.5,
                        ax + 0.5, ay + 0.5,
                        _a.x, _a.y,
                        _b.x, _b.y
                    ];

                    // depending on direction, set wall shading
                    if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                        context.fillStyle = item[RENDERCOLOR][1] || altColorAlpha;
                    } else {
                        context.fillStyle = item[RENDERCOLOR][0] || wallColorAlpha;
                    }

                    drawShape(walls);
                }

                roof[j]     = _a.x;
                roof[j + 1] = _a.y;
            }

            // fill roof and optionally stroke it
            context.fillStyle   = item[RENDERCOLOR][2] || roofColorAlpha;
            context.strokeStyle = item[RENDERCOLOR][1] || altColorAlpha;
            drawShape(roof, true);
        }







        function renderPass() {
            context.clearRect(0, 0, width, height);
context.fillStyle = 'rgba(255,255,255,1)';
context.fillRect(0, 0, width, height);
            // data needed for rendering
            if (!meta || !data) {
                return;
            }

            // show buildings in high zoom levels only
            // avoid rendering during zoom
            if (zoom < minZoom || isZooming) {
                return;
            }

            var
                i, il, j, jl,
                item,
                f, h, m,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                sortCam = [camX + offX, camY + offY],
                footprint, roof, walls,
                isVisible,
                ax, ay, bx, by, _a, _b
            ;

            data.sort(function (a, b) {
                return distance(b[CENTER], sortCam) / b[HEIGHT] * 0.5 - distance(a[CENTER], sortCam) / a[HEIGHT] * 0.5 ;
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
                m = CAM_Z / (CAM_Z - h);

                roof = []; // typed array would be created each pass and is way too slow
                walls = [];

                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    bx = footprint[j + 2];
                    by = footprint[j + 3];

                    // project 3d to 2d on extruded footprint
                    _a = project(ax, ay, m);
                    _b = project(bx, by, m);

                    // backface culling check
                    if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                        walls = [
                            bx + 0.5, by + 0.5,
                            ax + 0.5, ay + 0.5,
                            _a.x, _a.y,
                            _b.x, _b.y
                        ];

                        // depending on direction, set wall shading
                        if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                            context.fillStyle = item[RENDERCOLOR][1] || altColorAlpha;
                        } else {
                            context.fillStyle = item[RENDERCOLOR][0] || wallColorAlpha;
                        }

                        drawShape(walls);
                    }

                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }

                // fill roof and optionally stroke it
                context.fillStyle   = item[RENDERCOLOR][2] || roofColorAlpha;
                context.strokeStyle = item[RENDERCOLOR][1] || altColorAlpha;
                drawShape(roof, true);
            }
        }

        function render() {
            var algo = 'optimized-anaglyphs';

            camX -= 10;
            renderPass();
            var canvasData1 = context.getImageData(0, 0, width, height);

            camX += 20;
            renderPass();
            var canvasData2 = context.getImageData(0, 0, width, height);

            camX -= 10;

            for (var i = 0, il = canvasData1.data.length; i < il; i+= 4) {
                var r1 = canvasData1.data[i + 0],
                    r2 = canvasData2.data[i + 0],
                    g1 = canvasData1.data[i + 1],
                    g2 = canvasData2.data[i + 1],
                    b1 = canvasData1.data[i + 2],
                    b2 = canvasData2.data[i + 2],
                    ra = 0,
                    ga = 0,
                    ba = 0
                ;

                switch (algo) {
                    case 'true-anaglyphs':
                        ra = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
                        ba = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
                        break;
                    case 'optimized-anaglyphs':
                        ra = 0.7 * g1 + 0.3 * b1;
                        ga = g2;
                        ba = b2;
                        break;
                    case 'gray-anaglyphs':
                        ra = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
                        ga = ba = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
                        break;
                    case 'color-anaglyphs':
                        ra = r1;
                        ga = r2;
                        ba = b2;
                        break;
                    case 'half-color-anaglyphs':
                        ra = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
                        ga = r2;
                        ba = b2;
                        break;
                }
                canvasData1.data[i + 0] = ra;
                canvasData1.data[i + 1] = ga;
                canvasData1.data[i + 2] = ba;
            }
            context.clearRect(0, 0, width, height);
            context.putImageData(canvasData1, 0, 0);
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
                x: ((x - camX) * m + camX << 0) + 0.5, // + 0.5: disabling(!) anti alias
                y: ((y - camY) * m + camY << 0) + 0.5  // + 0.5: disabling(!) anti alias
            };
        }
