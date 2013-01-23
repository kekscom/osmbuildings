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


        function render() {
            context.clearRect(0, 0, width, height);
//context.fillStyle = 'rgba(240,235,230,0.75)';
//context.fillRect(0, 0, width, height);

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


if(item[HEIGHT] > 7) {
                camX += 10;
                wallColorAlpha = new Color((wallColor.g * 0.7 + wallColor.b * 0.3 ), 128, 128, wallColor.a / 2) + '';
                altColorAlpha  = new Color((altColor.g  * 0.7 + altColor.b  * 0.3 ), 128, 128, altColor.a  / 2) + '';
                roofColorAlpha = new Color((roofColor.g * 0.7 + roofColor.b * 0.3 ), 128, 128, roofColor.a / 2) + '';
                drawBuilding(item, footprint);

                camX -= 20;
                wallColorAlpha = new Color(128, (wallColor.g) , (wallColor.b) , wallColor.a / 2) + '';
                altColorAlpha  = new Color(128, (altColor.g ) , (altColor.b ) ,  altColor.a / 2) + '';
                roofColorAlpha = new Color(128, (roofColor.g) , (roofColor.b) , roofColor.a / 2) + '';
                drawBuilding(item, footprint);

                camX += 10;

                wallColorAlpha = wallColor + '';
                altColorAlpha  = altColor  + '';
                roofColorAlpha = roofColor + '';
                //drawBuilding(item, footprint);
} else {
                drawBuilding(item, footprint);
}
            }
        }

        function drawBuilding(item, footprint) {
//if(item[HEIGHT] > 7) console.log(wallColorAlpha, altColorAlpha, roofColorAlpha);
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
            drawShape(roof, false);
        }







        function renderPass() {
            context.clearRect(0, 0, width, height);
context.fillStyle = 'rgba(241, 237, 233, 0.25)';
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
                drawShape(roof, false);
            }
        }
/*
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

            var
                i, il, j, jl,
                item,
                f, h, m, n,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                sortCam = [camX + offX, camY + offY],
                footprint, roof, walls,
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
                walls = [];

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
                        walls = [
                            bx + 0.5, by + 0.5,
                            ax + 0.5, ay + 0.5,
                            _a.x, _a.y,
                            _b.x, _b.y
                        ];

                        // depending on direction, set wall shading
                        if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                            context.fillStyle = item[RENDER_COLOR][1] || altColorAlpha;
                        } else {
                            context.fillStyle = item[RENDER_COLOR][0] || wallColorAlpha;
                        }

                        drawShape(walls);
                    }

                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }

                // fill roof and optionally stroke it
                context.fillStyle = item[RENDER_COLOR][2] || roofColorAlpha;
                context.strokeStyle = item[RENDER_COLOR][1] || altColorAlpha;
                drawShape(roof, true);
            }
        }
*/
        function renderX() {
            var algo = 'optimized-anaglyphs';

            camX -= 10;
            renderPass();
            var canvasData1 = context.getImageData(0, 0, width, height);

            camX += 20;
            renderPass();
            var canvasData2 = context.getImageData(0, 0, width, height);

            camX -= 10;

            var
                data1 = canvasData1.data,
                data2 = canvasData2.data,
                R, G, B
            ;

            for (var i = 0, il = data1.length; i < il; i+= 4) {
                R = i;
                G = i + 1;
                B = i + 2;
                switch (algo) {
                    case 'true-anaglyphs':
                        data1[R] = 0.299 * data1[R] + 0.587 * data1[G] + 0.114 * data1[B];
                        data1[B] = 0.299 * data2[R] + 0.587 * data2[G] + 0.114 * data2[B];
                        break;
                    case 'optimized-anaglyphs':
                        data1[R] = 0.7 * data1[G] + 0.3 * data1[B];
                        data1[G] = data2[G];
                        data1[B] = data2[B];
                        break;
                    case 'gray-anaglyphs':
                        data1[R] = 0.299 * data1[R] + 0.587 * data1[G] + 0.114 * data1[B];
                        data1[G] = data1[B] = 0.299 * data2[R] + 0.587 * data2[G] + 0.114 * data2[B];
                        break;
                    case 'color-anaglyphs':
                        data1[R] = data1[R];
                        data1[G] = data2[R];
                        data1[B] = data2[B];
                        break;
                    case 'half-color-anaglyphs':
                        data1[R] = 0.299 * data1[R] + 0.587 * data1[G] + 0.114 * data1[B];
                        data1[G] = data2[R];
                        data1[B] = data2[B];
                        break;
                }
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
