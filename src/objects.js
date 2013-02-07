
        function render() {
            var p, x, y;

            context.clearRect(0, 0, width, height);
            context.strokeStyle = altColorAlpha;

            p = geoToPixel(52.50700, 13.33300);
            x = p.x - originX;
            y = p.y - originY;
            cylinder(x, y, 20, 200);

            p = geoToPixel(52.50557, 13.33451);
            x = p.x - originX;
            y = p.y - originY;
            cylinder(x-60, y, 30, 10);

            dome(x, y, 30);
        }

        //*** finished methods ************************************************

        /**
         * @param x {float} position on ground level (in pixels)
         * @param y {float} position on ground level (in pixels)
         * @param r {float} radius (in pixels)
         * @param h {float} height in (in pixels)
         */
        function cylinder(x, y, r, h, minHeight) {
            var m = camZ / (camZ - h),
                p = project(x, y, m),
                _x = p.x,
                _y = p.y,
                _r = r * m
            ;

            if (minHeight) {
                var $x = x;
                m = camZ / (camZ - minHeight),
                p = project(x, y, m);
                x = p.x;
                y = p.y;
                p = project($x - r, y, m);
                r = x - p.x;
            }

            var t = getTangents(x, y, r, _x, _y, _r), // common tangents for ground and roof circle
                tx, ty, ta,
                isAlt,
                ax, ay
            ;

            // no tangents? roof overlaps everything near cam position
            if (t) {
                // draw normal and alternative colored wall segments
                for (var i = 0; i < 2; i++) {
                    isAlt = !!i;
                    tx = t[i][0];
                    ty = t[i][1];
                    ax = (x - tx) * (isAlt ? 1 : -1);
                    ay = (y - ty) * (isAlt ? 1 : -1);
                    ta = Math.atan2(ay, ax) + (isAlt ? PI : 0);

                    // tangent not visible, avoid flickering
                    if (ax < 0) {
                        continue;
                    }

                    context.fillStyle = !isAlt ? wallColorAlpha : altColorAlpha;
                    context.beginPath();
                    context.moveTo(tx, ty);
                    context.arc(x, y, r, ta, HALF_PI, isAlt);
                    context.arc(_x, _y, _r, HALF_PI, ta, !isAlt);
                    context.closePath();
                    context.fill();
                }
            }

            context.fillStyle = roofColorAlpha;
            circle(_x, _y, _r, TRUE);
        }

        /**
         * @param x {float} position (in pixels)
         * @param y {float} position (in pixels)
         * @param r {float} radius (in pixels)
         * @param stroke {boolean} optionally stroke circle's outline
         */
        function circle(x, y, r, stroke) {
            context.beginPath();
            context.arc(x, y, r, 0, 360);
            if (stroke) {
                context.stroke();
            }
            context.fill();
        }

        /**
         * @see http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
         *
         * @param x1 {float} position circle 1
         * @param y1 {float} position circle 1
         * @param r1 {float} radius circle 1
         * @param x2 {float} position circle 2
         * @param y2 {float} position circle 2
         * @param r2 {float} radius circle 2
         * @returns {array} list of two tangents as points on each circle
         */
        function getTangents(x1, y1, r1, x2, y2, r2) {
            var sqd = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
            if (sqd <= (r1 - r2) * (r1 - r2)) {
                return;
            }

            var d = sqrt(sqd),
                vx = (x2 - x1) / d,
                vy = (y2 - y1) / d,
                res = [],
                c = (r1 - r2) / d,
                h, nx, ny
            ;

            // Let A, B be the centers, and C, D be points at which the tangent
            // touches first and second circle, and n be the normal vector to it.
            //
            // We have the system:
            //   n * n = 1          (n is a unit vector)
            //   C = A + r1 * n
            //   D = B + r2 * n
            //   n * CD = 0         (common orthogonality)
            //
            // n * CD = n * (AB + r2*n - r1*n) = AB*n - (r1 -/+ r2) = 0,  <=>
            // AB * n = (r1 -/+ r2), <=>
            // v * n = (r1 -/+ r2) / d,  where v = AB/|AB| = AB/d
            // This is a linear equation in unknown vector n.

            // Now we're just intersecting a line with a circle: v*n=c, n*n=1

            h = sqrt(max(0, 1 - c * c));
            for (var sign = 1; sign >= -1; sign -= 2) {
                nx = vx * c - sign * h * vy;
                ny = vy * c + sign * h * vx;
                res.push([
                    x1 + r1 * nx << 0, y1 + r1 * ny << 0,
                    x2 + r2 * nx << 0, y2 + r2 * ny << 0
                ]);
            }

            return res;
        }


        //*** helpers *********************************************************

//        function ellipse(x, y, w, h, stroke) {
//            var
//                w2 = w / 2, h2 = h / 2,
//                hB = w2 * 0.5522848,
//                vB = h2 * 0.5522848,
//                eX = x + w2, eY = y + h2,
//                mX = x, mY = y
//            ;
//
//            x -= w2;
//            y -= h2;
//
//            context.beginPath();
//            context.moveTo(x, mY);
//            context.bezierCurveTo( x,      mY - vB, mX - hB,  y,      mX, y);
//            context.bezierCurveTo(mX + hB,       y, eX,      mY - vB, eX, mY);
//            context.bezierCurveTo(eX,      mY + vB, mX + hB, eY,      mX, eY);
//            context.bezierCurveTo(mX - hB,      eY,  x,      mY + vB,  x, mY);
//            context.closePath();
//            context.fill();
//            if (stroke) {
//                context.stroke();
//            }
//        }

        function line(a, b) {
            context.beginPath();
            context.moveTo(a[0], a[1]);
            context.lineTo(b[0], b[1]);
            context.stroke();
        }

        //*********************************************************************

        function cone(x, y, r, h, minHeight) {
            // TODO: min height
            var apex = project(x, y, camZ / (camZ - h)),
                _x = apex.x,
                _y = apex.y
            ;

            var t = getTangentsFromPoint(x, y, r, _x, _y),
                tx, ty, ta,
                isAlt,
                ax, ay
            ;

            // draw normal and alternative colored wall segments
            for (var i = 0; i < 2; i++) {
                isAlt = !!i;
                tx = t[i][0];
                ty = t[i][1];
                ax = (x - tx) * (isAlt ? 1 : -1);
                ay = (y - ty) * (isAlt ? 1 : -1);
                ta = Math.atan2(ay, ax) + (isAlt ? PI : 0);

                // tangent not visible, avoid flickering
                if (ax < 0) {
                    continue;
                }

                context.fillStyle = !isAlt ? wallColorAlpha : altColorAlpha;
                context.beginPath();
                context.moveTo(tx, ty);
                context.arc(x, y, r, ta, HALF_PI, isAlt);
                context.arc(_x, _y, 0, HALF_PI, ta, !isAlt);
                context.closePath();
                context.fill();
            }

//            circle(x, y, r);
//
//            context.beginPath();
//            context.moveTo(x - r, y);
//            context.lineTo(_x, _y);
//            context.lineTo(x + r, y);
//            context.stroke();
//
//            context.beginPath();
//            context.moveTo(x, y - r);
//            context.lineTo(_x, _y);
//            context.lineTo(x, y + r);
//            context.stroke();
        }


        var KAPPA = 0.5522847498;
        function dome(x, y, r, h) {
            if (!h) {
                h = r;
            }

            var k = h * KAPPA,
                g = 1,
                n = camZ / (camZ - (h - k)),
                m = camZ / (camZ - h),
                _r = r * m,
                _k = _r * KAPPA
            ;

var apex = project(x, y, m);

            // VERTICAL TANGENT POINTS ON SPHERE:
            // side view at scenario:
            // sphere at x/y & radius   => circle at y/camZ & height (+ minHeight)
            // cam    at camX/camY/camZ => point  at camY/0
            var t = getTangentsFromPoint(y, camZ, r, camY, 0);

var Y = t[0][0];
var H = (camZ - t[0][1]);

var p = project(x, Y, camZ / (camZ - H));
line([x, Y], [p.x, p.y]);
debugMarker(p.x, p.y);

//******************************************************************************

context.fillStyle = roofColorAlpha;
circle(x, y, r, TRUE);

line([x, y], [apex.x, apex.y]);

//******************************************************************************

var Y = t[1][0];
var H = (camZ - t[1][1]);

var p = project(x, Y, camZ / (camZ - H));
line([x, Y], [p.x, p.y]);
debugMarker(p.x, p.y);

line([x, y], [x, Y]);
line([apex.x, apex.y], [p.x, p.y]);


//******************************************************************************

//circle(y, camZ, r, TRUE);
//debugMarker(camY, 0, '#ff0000');
//line([t[0][0], t[0][1]], [t[0][2], t[0][3]]);
//line([t[1][0], t[1][1]], [t[1][2], t[1][3]]);

//******************************************************************************


//            context.fillStyle = wallColorAlpha
//            context.beginPath();
//            context.arc(apex.x, apex.y, r, 0, 1*PI, TRUE);
//            context.closePath();
//            context.stroke();

            context.beginPath();

            var a  = project(x - r,  y, g);
            var _a = project(x - r,  y, n);
            var _b = project(x - _k, y, m);
            var b  = project(x,      y, m);

            context.moveTo(a.x, a[1]);
            context.bezierCurveTo(_a.x, _a.y, _b.x, _b.y, b.x, b.y);

            var a  = project(x + r, y, g);
            var _a = project(x + r, y, n);
            var _b = project(x + _k, y, m);
            var b  = project(x,     y, m);

            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(_a.x, _a.y, _b.x, _b.y, b.x, b.y);

            var a  = project(x, y + r, g);
            var _a = project(x, y + r, n);
            var _b = project(x, y + _k, m);
            var b  = project(x, y,     m);

            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(_a.x, _a.y, _b.x, _b.y, b.x, b.y);

            var a  = project(x, y - r, g);
            var _a = project(x, y - r, n);
            var _b = project(x, y - _k, m);
            var b  = project(x, y,     m);

            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(_a.x, _a.y, _b.x, _b.y, b.x, b.y);

            context.stroke();
        }


        function getTangentsFromPoint(x1, y1, r, x2, y2) {
            var sqd = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

            var d = sqrt(sqd),
                vx = (x2 - x1) / d,
                vy = (y2 - y1) / d,
                res = [],
                c = r / d,
                h, nx, ny
            ;

            h = sqrt(max(0, 1 - c * c));
            for (var sign = 1; sign >= -1; sign -= 2) {
                nx = vx * c - sign * h * vy;
                ny = vy * c + sign * h * vx;
                res.push([
                    x1 + r * nx << 0, y1 + r * ny << 0,
                    x2, y2
                ]);
            }

            return res;
        }


        function drawPyramidalRoof(points, height, strokeRoofs) {
            if (height <= 20) {
                context.fillStyle = 'rgba(225,175,175,0.5)';
            }

            if (points.length > 8 || height > 20) {
                drawShape(points, strokeRoofs);
                return;
            }

            var h = height * 1.3,
                cx = 0, cy = 0,
                num = points.length / 2,
                apex
            ;

            for (var i = 0, il = points.length - 1; i < il; i += 2) {
                cx += points[i];
                cy += points[i + 1];
            }

            apex = project(cx / num, cy / num, camZ / (camZ - h));

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
                    apex.x, apex.y
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
                apex.x, apex.y
            ], strokeRoofs);
        }

        function prism() {
        }

        function pyramid() {
        }

        function sphere() {
        }