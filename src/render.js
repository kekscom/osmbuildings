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
                    if ((bx - ax) * (_a[1] - ay) > (_a[0] - ax) * (by - ay)) {
                        walls = [
                            bx + 0.5, by + 0.5,
                            ax + 0.5, ay + 0.5,
                            _a[0], _a[1],
                            _b[0], _b[1]
                        ];

                        // depending on direction, set wall shading
                        if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                            context.fillStyle = item[RENDERCOLOR][1] || altColorAlpha;
                        } else {
                            context.fillStyle = item[RENDERCOLOR][0] || wallColorAlpha;
                        }

                        drawShape(walls);
                    }

                    roof[j]     = _a[0];
                    roof[j + 1] = _a[1];
                }

                // fill roof and optionally stroke it
                context.fillStyle = item[RENDERCOLOR][2] || roofColorAlpha;
                context.strokeStyle = item[RENDERCOLOR][1] || altColorAlpha;
                drawRoof3(roof, h);
            }
        }





//        function circle(x, y, diameter, stroke) {
//            ellipse(x, y, diameter, diameter, stroke);
//        }

        function circle(x, y, diameter) {
            context.beginPath();
            context.arc(x, y, diameter / 2, 0, 360);
            context.stroke();
        }

        var KAPPA = 0.5522847498;

        function dome(x, y, z, radius) {
            z = 0;
            radius = 40;

            var
                k = radius * KAPPA,

                mz  = CAM_Z / (CAM_Z - z),
                mzk = CAM_Z / (CAM_Z - (z + k / 2)),
                mzr = CAM_Z / (CAM_Z - (z + radius / 2)),

                a, b, c,
                apex = project(x, y, mzr)
            ;

            a = project(x-radius, y, mz);
            b = project(x-radius, y, mzk);
            c = project(x-k,      y, mzr);

            context.beginPath();
            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(b[0], b[1], c[0], c[1], apex[0], apex[1]);

            a = project(x+radius, y, mz);
            b = project(x+radius, y, mzk);
            c = project(x+k,      y, mzr);


            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(b[0], b[1], c[0], c[1], apex[0], apex[1]);



            a = project(x, y-radius, mz);
            b = project(x, y-radius, mzk);
            c = project(x, y-k,      mzr);

            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(b[0], b[1], c[0], c[1], apex[0], apex[1]);

            a = project(x, y+radius, mz);
            b = project(x, y+radius, mzk);
            c = project(x, y+k,      mzr);

            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(b[0], b[1], c[0], c[1], apex[0], apex[1]);

                context.stroke();
        }

        function sphere() {
        }



        function ellipse(x, y, w, h, stroke) {
            var
                w2 = w / 2, h2 = h / 2,
                hB = w2 * 0.5522848,
                vB = h2 * 0.5522848,
                eX = x + w2, eY = y + h2,
                mX = x, mY = y
            ;

            x -= w2;
            y -= h2;

            context.beginPath();
            context.moveTo(x, mY);
            context.bezierCurveTo( x,      mY - vB, mX - hB,  y,      mX, y);
            context.bezierCurveTo(mX + hB,       y, eX,      mY - vB, eX, mY);
            context.bezierCurveTo(eX,      mY + vB, mX + hB, eY,      mX, eY);
            context.bezierCurveTo(mX - hB,      eY,  x,      mY + vB,  x, mY);
            context.closePath();
            context.fill();
            if (stroke) {
                context.stroke();
            }
        }

        function drawRoof2(points) {
            context.fillStyle = 'rgba(240,0,0,0.25)';
            context.strokeStyle = strokeColor.adjustAlpha(zoomAlpha) + '';

            var
                h = 20,
                center = [
                    (points[0] + points[2] + points[4] + points[6]) / 4,
                    (points[1] + points[3] + points[5] + points[7]) / 4
                ],
                apex = project(center[0], center[1], CAM_Z / (CAM_Z - h))
            ;

            var d = 65;
            circle(center[0], center[1], d);

            context.beginPath();
            context.moveTo(center[0] - d / 2, center[1]);
            context.lineTo(apex[0], apex[1]);
            context.lineTo(center[0] + d / 2, center[1]);
            context.stroke();

            context.beginPath();
            context.moveTo(center[0], center[1] - d / 2);
            context.lineTo(apex[0], apex[1]);
            context.lineTo(center[0], center[1] + d / 2);
            context.stroke();
        }


        function drawRoof3(points, h) {
            drawShape(points, true);

            var
                center = [
                    (points[0] + points[2] + points[4] + points[6]) / 4,
                    (points[1] + points[3] + points[5] + points[7]) / 4
                ],
                apex = project(center[0], center[1], CAM_Z / (CAM_Z - h))
            ;

            var d = 75;
            //circle(center[0], center[1], d);
            var apex = project(center[0], center[1], CAM_Z / (CAM_Z));
            circle(apex[0], apex[1], d);


            var apex = project(center[0], center[1], CAM_Z / (CAM_Z - d/12));
            circle(apex[0], apex[1], d  * 0.6);




            dome(center[0], center[1], 30, 30);
        }

        function drawRoof(points, height, strokeRoofs) {
            if (height <= 20) {
                context.fillStyle = 'rgba(225,175,175,0.5)';
            }

            if (points.length > 8 || height > 20) {
                drawShape(points, strokeRoofs);
                return;
            }

            var
                h = height * 1.3,
                cx = 0, cy = 0,
                num = points.length / 2,
                apex
            ;

            for (var i = 0, il = points.length - 1; i < il; i += 2) {
                cx += points[i];
                cy += points[i + 1];
            }

            apex = project(cx / num, cy / num, CAM_Z / (CAM_Z - h));

            for (var i = 0, il = points.length - 3; i < il; i += 2) {
                var ax = points[i];
                var bx = points[i + 2];
                var ay = points[i + 1];
                var by = points[i + 3];

                //if ((ax - bx) > (ay - by)) {
                if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                    context.fillStyle = 'rgba(200,100,100,0.25)';
                } else {
                    context.fillStyle = 'rgba(200,175,175,0.25)';
                }

                drawShape([
                    points[i],     points[i + 1],
                    points[i + 2], points[i + 3],
                    apex[0], apex[1]
                ], strokeRoofs);
            }

            var ax = points[i];
            var bx = points[0];
            var ay = points[i + 1];
            var by = points[1];

            if ((ax - bx) > (ay - by)) {
                context.fillStyle = 'rgba(250,0,0,0.25)';
            } else {
                context.fillStyle = 'rgba(250,100,100,0.25)';
            }

            drawShape([
                points[i], points[i + 1],
                points[0], points[1],
                apex[0], apex[1]
            ], strokeRoofs);
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
            return [
                ((x - camX) * m + camX << 0) + 0.5, // + 0.5: disabling(!) anti alias
                ((y - camY) * m + camY << 0) + 0.5  // + 0.5: disabling(!) anti alias
            ];
        }
