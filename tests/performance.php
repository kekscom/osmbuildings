<!DOCTYPE html>
<html>
<head>
	<title>OSM Buildings - Performance Tests</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<style>
	canvas {
		width: 800px;
		height: 600px;
		border: 1px solid #cc0000;
		-webkit-transform:translate3d(0,0,0);
	}
	#console {
		font-family: monospace;
        white-space: pre;
	}
	</style>
	<script src="benchmark/performance.js"></script>
</head>

<body>
	<canvas></canvas>
	<div id="console"></div>

	<script>
	var output = document.querySelector('#console');
	var log = function (txt) {
		output.innerHTML += txt + '<br>';
	}

	//*************************************************************************

	var width = 800, height = 600;
	var canvas = document.querySelector('canvas');
	var context = canvas.getContext('2d');

	canvas.width = width;
	canvas.height = height;

	context.lineCap = 'round';
	context.lineJoin = 'round';
	context.lineWidth = 1;

	//*************************************************************************

// OK Flache Gebäude nicht zeichnen
// OK Bei flachen Gebäuden nur das Dach zeichnen, fixiert
// OK Bei flachen Gebäuden nur das Dach zeichnen
// OK Bei flachen Gebäuden den Grundriss und das Dach zeichnen
// Bei flachen Gebäuden keinen Schatten zeichnen
// OK Keine Dachlinie zeichnen
// Wenn Schatten, dann keine Dachlinie zeichnen
// OK Keine alternative Wandschattierung + keine Sortierung
// OK Flächen kombinieren

// Simplifikation?
// Viewport Margin? => data amount
// buffering (hidden canvas)
// test 3d anaglyph
// RequestAnimationFrame

	//*************************************************************************

	var wallColorAlpha = 'rgba(200, 190, 180, 0.7)',
		altColorAlpha = 'rgba(180, 170, 160, 0.7)',
		roofColorAlpha = 'rgba(220, 210, 200, 0.7)',
		camX = width/2,
		camY = height,
		camZ = height;

    var HEIGHT = 0, FOOTPRINT = 1, CENTER = 2;

	var rawData = [], footprint;
	for (var i = 0, il = 150; i < il; i++) {
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

		rawData[i][HEIGHT] = i < 60 ? Perf.random(5, 20) : Perf.random(20, 50);
		rawData[i][FOOTPRINT] = footprint;
		rawData[i][CENTER] = center(footprint);
	}

	//*************************************************************************

    var sunX, sunY, sunZ;

    function renderShadows() {
        sunX = camX;
        sunY = camY * 1.2;
        sunZ = camZ / 1.5;

        var i, il, j, jl,
            item,
            f, m, n,
            x, y,
            footprint, roof,
            isVisible,
            ax, ay, bx, by,
            _a, _b
        ;

        context.fillStyle = 'rgba(0,0,0,0.4)';

        for (i = 0, il = rawData.length; i < il; i++) {
            item = rawData[i];

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
			item,
            isFlat,
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
            renderShadows();
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
            isFlat = item[HEIGHT] < 20;

			if (isFlat && (options & FLAT_SKIP)) {
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
        		context.fillStyle = altColorAlpha;
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
		FLAT_SKIP = 8,
		FLAT_NO_PERSPECTIVE = 16,
		FLAT_NO_WALLS = 32,
		FLAT_DRAW_GROUND = 64,
        DRAW_SHADOWS = 128;

	var perf = new Perf('Render performance tests', 300);

	perf.add('default', function () {
		render();
	});

	perf.add('combined faces', function () {
		render(COMBINE_FACES);
	});

	perf.add('shaded walls', function () {
		render(SHADE_WALLS);
	});

	perf.add('stroked roofs', function () {
		render(STROKE_ROOFS);
	});

	perf.add('skip flat (should be filtered in advance)', function () {
		render(FLAT_SKIP);
	});

	perf.add('flat, only roofs, fixed', function () {
		render(FLAT_NO_PERSPECTIVE | FLAT_NO_WALLS);
	});

    perf.add('flat, only roofs', function () {
		render(FLAT_NO_WALLS);
	});

	perf.add('flat, roofs and ground', function () {
		render(FLAT_NO_WALLS | FLAT_DRAW_GROUND);
	});

	perf.add('draw shadows', function () {
		render(DRAW_SHADOWS);
	});

	perf.run();

	</script>
</body>
</html>