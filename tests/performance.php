<!DOCTYPE html>
<html>
<head>
	<title>OSM Buildings - Performance Tests</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
    <style>
    html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
    }
	canvas {
		width: 100%;
		height: 100%;
		-webkit-transform: translate3d(0,0,0);
	}
	</style>
	<script src="benchmark/performance.js"></script>
</head>

<body>
	<canvas></canvas>

	<script>
	var width = innerWidth, height = innerHeight;
	var canvas = document.querySelector('canvas');
	var context = canvas.getContext('2d');

	canvas.width = width;
	canvas.height = height;

	context.lineCap = 'round';
	context.lineJoin = 'round';
	context.lineWidth = 1;

	//*************************************************************************

// Simplification?
// Viewport Margin? => data amount
// buffering (hidden canvas)
// test 3d anaglyph
// RequestAnimationFrame
// check effect of fill area size and alpha amount

	//*************************************************************************

	var wallColorAlpha = 'rgba(200, 190, 180, 0.7)',
		altColorAlpha = 'rgba(180, 170, 160, 0.7)',
		roofColorAlpha = 'rgba(220, 210, 200, 0.7)',
		camX = width/2,
		camY = height,
		camZ = height,
        sunX, sunY, sunZ,
        flatHeight = 20;

    var HEIGHT = 0, FOOTPRINT = 1, CENTER = 2;

	var rawData = [], footprint,
        numBuildings = width * height / 3000 << 0;

	for (var i = 0; i < numBuildings; i++) {
		rawData[i] = [];
	    footprint = [];
	    footprint[0] = Perf.random(0, width);
	    footprint[1] = Perf.random(0, height);
		footprint[2] = footprint[0] - Perf.random(10, 50);
		footprint[3] = footprint[1] - Perf.random(10, 50);
		footprint[4] = footprint[2] + Perf.random(10, 50);
		footprint[5] = footprint[3] - Perf.random(10, 50);
		footprint[6] = footprint[4] + Perf.random(10, 50);
		footprint[7] = footprint[5] + Perf.random(10, 50);
		footprint[8] = footprint[6] - Perf.random(10, 50);
		footprint[9] = footprint[7] + Perf.random(10, 50);

		footprint[10] = footprint[0];
		footprint[11] = footprint[1];

		rawData[i][HEIGHT] = i < 60 ? Perf.random(5, flatHeight) : Perf.random(flatHeight, 50);
		rawData[i][FOOTPRINT] = footprint;
		rawData[i][CENTER] = center(footprint);
	}

// just a single test building
//
//    rawData = [];
//
//    footprint = [];
//    footprint[0] = width / 2 << 0;
//    footprint[1] = height / 2 << 0;
//
//    footprint[10] = footprint[0] + 100;
//    footprint[11] = footprint[1] + 50;
//
//    footprint[8] = footprint[0] + 400;
//    footprint[9] = footprint[1] - 100;
//
//    footprint[6] = footprint[0] + 200;
//    footprint[7] = footprint[1] - 200;
//
//    footprint[4] = footprint[0] + 100;
//    footprint[5] = footprint[1] - 150;
//
//    footprint[2] = footprint[0] + 200;
//    footprint[3] = footprint[1] - 100;
//
//    footprint[12] = footprint[0];
//    footprint[13] = footprint[1];
//
//    rawData[0] = [];
//    rawData[0][HEIGHT] = 80;
//    rawData[0][FOOTPRINT] = footprint;
//    rawData[0][CENTER] = center(footprint);

	//*************************************************************************

    function createShadows(options) {
        sunX = camX;
        sunY = 3000;
        sunZ = 500;

        var i, il, j, jl,
            item, isFlat,
            f, m,
            x, y,
            footprint, roof, mode,
            isVisible,
            ax, ay, bx, by,
            _a, _b
        ;

        var grounds = [];

        context.fillStyle = 'rgba(0,0,0,0.4)';

        for (i = 0, il = rawData.length; i < il; i++) {
            item = rawData[i];
            isFlat = item[HEIGHT] < flatHeight;

            if (isFlat && (options & SKIP_FLAT)) {
                continue;
            }

            if (isFlat && (options & FLAT_NO_SHADOWS)) {
                continue;
            }

            isVisible = false;
            f = item[FOOTPRINT];
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]     = x = (f[j]    );
                footprint[j + 1] = y = (f[j + 1]);

                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            m = item[HEIGHT];

            if (isFlat && (options & FLAT_SIMPLE_SHADOWS)) {
                roof = [];
                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    _a = projectShadow(ax, ay, m);
                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }
                drawShape(roof);
            } else if (options & COMBINED_SHADOWS) {
                mode = null;
                context.beginPath();

                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    bx = footprint[j + 2];
                    by = footprint[j + 3];

                    _a = projectShadow(ax, ay, m);
                    _b = projectShadow(bx, by, m);

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
            } else {
                roof = [];
                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    bx = footprint[j + 2];
                    by = footprint[j + 3];

                    _a = projectShadow(ax, ay, m);
                    _b = projectShadow(bx, by, m);

                    if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                        drawShape([
                            bx + 0.5, by + 0.5,
                            ax + 0.5, ay + 0.5,
                            _a.x, _a.y,
                            _b.x, _b.y
                        ]);
                    }
                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }
                drawShape(roof);
            }

            var g = [];
            for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];
                g[j]     = ax;
                g[j + 1] = ay;
            }
            grounds.push(g);
        }

        context.fillStyle = 'rgb(128,128,128)';
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
            var r, g, b, a;
            for (var i = 0, il = imgData.data.length; i < il; i+= 4) {
                r = imgData.data[i + 0];
                g = imgData.data[i + 1];
                b = imgData.data[i + 2];

                a = imgData.data[i + 3];
//console.log(r, g, b, a)
                if (r > 100) {
                    imgData.data[i + 0] = 0;
                    imgData.data[i + 1] = 0;
                    imgData.data[i + 2] = 0;
                    imgData.data[i + 3] = 0;
                } else if (a > 100) {
                    imgData.data[i + 3] = 100;
                }

            }
            context.putImageData(imgData, 0, 0);


            shadowBuffer.src = canvas.toDataURL();
            bufferIsFilled = true;
            return;
        }
        context.drawImage(shadowBuffer, 0, 0, width, height);
    }

    function projectShadow(x, y, z) {
        var m = sunZ / (sunZ - z);
        return {
            x: (x - sunX) * m + sunX,
            y: (y - sunY) * m + sunY
        };
    }

	function render(options) {
		context.clearRect(0, 0, width, height);

		var i, il, j, jl,
            data = [],
			item, isFlat,
			f, h, m,
			x, y,
			sortCam = [camX, camY],
			footprint, walls, roof, ground,
			isVisible,
			ax, ay, bx, by,
			a, b, _a, _b
		;

		for (i = 0, il = rawData.length; i < il; i++) {
            data[i] = rawData[i];
        }

        if (options & DRAW_SHADOWS) {
            renderShadows(options);
        }

		if (options & SHADE_WALLS) {
			data.sort(function (a, b) {
				return distance(b[CENTER], sortCam) / b[HEIGHT] - distance(a[CENTER], sortCam) / a[HEIGHT];
			});
		}

		if (!(options & SHADE_WALLS)) {
			context.fillStyle = wallColorAlpha;
		}

		for (i = 0, il = data.length; i < il; i++) {
			item = data[i];
            isFlat = item[HEIGHT] < flatHeight;

			if (isFlat && (options & SKIP_FLAT)) {
				continue;
			}

			isVisible = false;
			f = item[FOOTPRINT];
			footprint = [];
			for (j = 0, jl = f.length - 1; j < jl; j += 2) {
				footprint[j]     = x = (f[j]    );
				footprint[j + 1] = y = (f[j + 1]);

				if (!isVisible) {
					isVisible = (x > 0 && x < width && y > 0 && y < height);
				}
			}

			if (!isVisible) {
				continue;
			}

			h = item[HEIGHT];
			m = camZ / (camZ - h);

			walls = [];
			roof = [];
			ground = [];

			for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
				ax = footprint[j];
				ay = footprint[j + 1];
				bx = footprint[j + 2];
				by = footprint[j + 3];

				if (isFlat && (options & FLAT_NO_PERSPECTIVE)) {
					_a = [ax, ay];
					_b = [by, by];
				} else {
					_a = project(ax, ay, m);
					_b = project(bx, by, m);
				}

				if (isFlat && (options & FLAT_NO_WALLS)) {
                    if (options & FLAT_DRAW_GROUND) {
        				ground[j]     = ax;
                		ground[j + 1] = ay;
                    }
                } else {
					if (options & COMBINE_FACES) {
						if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
							if (!walls.length) {
								walls.unshift(ay);
								walls.unshift(ax);
								walls.push(_a.x);
								walls.push(_a.y);
							}

							walls.unshift(by);
							walls.unshift(bx);
							walls.push(_b.x);
							walls.push(_b.y);
						} else {
							walls.length && drawShape(walls);
							walls = [];
						}
					} else {
						if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
							if (options & SHADE_WALLS) {
								if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
									context.fillStyle = altColorAlpha;
								} else {
									context.fillStyle = wallColorAlpha;
								}
							}
							drawShape([
								bx + 0.5, by + 0.5,
								ax + 0.5, ay + 0.5,
								_a.x, _a.y,
								_b.x, _b.y
							]);
						}
					}
				}

				roof[j]     = _a.x;
				roof[j + 1] = _a.y;
			}

			if (options & COMBINE_FACES) {
				walls.length && drawShape(walls);
			}

            if (isFlat && (options & FLAT_DRAW_GROUND)) {
        		context.fillStyle = wallColorAlpha;
                drawShape(ground, false);
            }

			context.fillStyle = roofColorAlpha;
			context.strokeStyle = altColorAlpha;
			drawShape(roof, options & STROKE_ROOFS);
        }
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
		context.fill();
		if (stroke) {
			context.stroke();
		}
	}

	function project(x, y, m) {
		return {
			x: ((x - camX) * m + camX << 0),
			y: ((y - camY) * m + camY << 0)
		};
	}

    function distance(p1, p2) {
        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1]
        ;
        return dx * dx + dy * dy;
    }

    function center(points) {
        var len,
            x = 0, y = 0
        ;
        for (var i = 0, il = points.length - 3; i < il; i += 2) {
            x += points[i];
            y += points[i + 1];
        }
        len = (points.length - 2) * 2;
        return [x / len << 0, y / len << 0];
    }

	//*************************************************************************

	var COMBINE_FACES = 1,
		SHADE_WALLS = 2,
		STROKE_ROOFS = 4,
		SKIP_FLAT = 8,
		FLAT_NO_PERSPECTIVE = 16,
		FLAT_NO_WALLS = 32,
		FLAT_DRAW_GROUND = 64,
        DRAW_SHADOWS = 128,
        FLAT_NO_SHADOWS = 256,
        FLAT_SIMPLE_SHADOWS = 512,
        COMBINED_SHADOWS = 1024;

	var perf = new Perf(numBuildings, 500, 'URL');

	perf.add('no strokes, no shading, no shadows', function () {
		render();
	});

	perf.add('combine walls', function () {
		render(COMBINE_FACES);
	});

	perf.add('shade walls', function () {
		render(SHADE_WALLS);
	});

	perf.add('stroke roofs', function () {
		render(STROKE_ROOFS);
	});

	perf.add('skip flat', function () {
		render(SKIP_FLAT);
	});

	perf.add('flat without walls, fixed roofs', function () {
		render(FLAT_NO_PERSPECTIVE | FLAT_NO_WALLS);
	});

    perf.add('flat without walls', function () {
		render(FLAT_NO_WALLS);
	});

	perf.add('flat without walls, ground in wall color', function () {
		render(FLAT_NO_WALLS | FLAT_DRAW_GROUND);
	});

	perf.add('shadows', function () {
		render(DRAW_SHADOWS);
	});

	perf.add('combined shadows', function () {
		render(DRAW_SHADOWS | COMBINED_SHADOWS);
	});

	perf.add('shadows, flat with roof as shadow', function () {
		render(DRAW_SHADOWS | FLAT_SIMPLE_SHADOWS);
	});

	perf.add('shadows, flat without shadows', function () {
		render(DRAW_SHADOWS | FLAT_NO_SHADOWS);
	});

	perf.add('shading, combined shadows, flat with roof as shadow', function () {
		render(SHADE_WALLS | DRAW_SHADOWS | COMBINED_SHADOWS | FLAT_SIMPLE_SHADOWS);
	});

	perf.add('shading, combined shadows, flat without shadow', function () {
		render(SHADE_WALLS | DRAW_SHADOWS | SKIP_FLAT);
	});

	perf.add('shading, combined shadows', function () {
		render(SHADE_WALLS | DRAW_SHADOWS | COMBINED_SHADOWS);
	});

	perf.run();

	</script>
</body>
</html>