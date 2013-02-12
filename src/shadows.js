
var sunX, sunY, sunZ,
    shadowOriginX, shadowOriginY,
    shadowBuffer;

function drawShadows() {
    if (!shadowBuffer) {
        shadowOriginX = originX;
        shadowOriginY = originY;
        createShadows();
        return;
    }
    context.drawImage(shadowBuffer, shadowOriginX - originX, shadowOriginY - originY);
}

function createShadows() {
    var i, il, j, jl,
        item,
        f, h, m, n,
        x, y,
        offX = originX - meta.x,
        offY = originY - meta.y,
        footprint,
        mode,
        isVisible,
        ax, ay, bx, by,
        a, b, _a, _b,
        grounds = [], g
    ;

var dateTime = new Date('2013-02-09 08:30:00'),
    center = pixelToGeo(originX + halfWidth, originY + halfHeight),
    sunPos = getSunPosition(dateTime, center.latitude, center.longitude);
// console.log(sunPos.azimuth * RAD + 180, sunPos.altitude * RAD);
if (sunPos.altitude < 0) {
    return;
}
sunX = camX;
sunY = 50000;
sunZ = 2 * sunY * tan(sunPos.altitude);




    context.fillStyle = shadowColorAlpha;

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
        // precalculating projection height scale
        m = sunZ / (sunZ - h);

        // prepare same calculations for min_height if applicable
        if (item[MIN_HEIGHT]) {
            //h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
            h = item[MIN_HEIGHT];
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

        // store footprint
//        g = [];
//        for (j = 0, jl = footprint.length - 2; j < jl; j++) {
//            g[j] = footprint[j];
//        }
//        grounds.push(g);
          grounds.push(footprint);
    }

    // draw all footprints in a different color for later filtering

    context.fillStyle = wallColorAlpha;
    for (i = 0, il = grounds.length; i < il; i++) {
        drawShape(grounds[i]);
    }

    filterShadows();
    shadowBuffer = new Image();
    shadowBuffer.src = canvas.toDataURL();
}

function filterShadows() {
     var buffer = context.getImageData(0, 0, width, height),
        pixels = buffer.data,
        shadowAlpha = shadowColor.a * 255 <<0,
        maxAlpha = 255 / 100,
        r, a;

    for (var i = 0, il = pixels.length; i < il; i+= 4) {
        r = pixels[i + 0];
        a = pixels[i + 3];
        // make everything with color and maximum alpha fully transparent
        if (r && a >= maxAlpha) {
            pixels[i + 3] = 0;
        } else
        // reduce higher alpha values to max shadow color alpha
        // this removes dark overlapping areas in shadows but keeps all anti aliasing
        if (a > shadowAlpha) {
            pixels[i + 3] = shadowAlpha;
        }
    }

    context.putImageData(buffer, 0, 0);
}

function projectShadow(x, y, m) {
    return {
        x: (x - sunX) * m + sunX,
        y: (y - sunY) * m + sunY
    };
}

var sin = Math.sin, cos = Math.cos, rad = PI / 180,
    dayMs = 1000 * 60 * 60 * 24,
	J1970 = 2440588,
	J2000 = 2451545,
	M0    = rad * 357.5291,
	M1    = rad * 0.98560028,
	J0    = 0.0009,
	J1    = 0.0053,
	J2    = -0.0069,
	C1    = rad * 1.9148,
	C2    = rad * 0.0200,
	C3    = rad * 0.0003,
	P     = rad * 102.9372,
	e     = rad * 23.45,
	th0   = rad * 280.1600,
	th1   = rad * 360.9856235;

function dateToJulianDate(date) { return date.valueOf() / dayMs - 0.5 + J1970; }
function getSolarMeanAnomaly(Js) { return M0 + M1 * (Js - J2000); }
function getEquationOfCenter(M) { return C1 * sin(M) + C2 * sin(2 * M) + C3 * sin(3 * M); }
function getEclipticLongitude(M, C) { return M + P + C + PI; }
function getSunDeclination(Ls) { return Math.asin(sin(Ls) * sin(e)); }
function getRightAscension(Ls) { return Math.atan2(sin(Ls) * cos(e), cos(Ls)); }
function getSiderealTime(J, lw) { return th0 + th1 * (J - J2000) - lw; }
function getAzimuth(H, phi, d) { return Math.atan2(sin(H), cos(H) * sin(phi) - Math.tan(d) * cos(phi)); }
function getAltitude(H, phi, d) { return Math.asin(sin(phi) * sin(d) + cos(phi) * cos(d) * cos(H)); }

function getSunPosition(date, lat, lng) {
	var lw  = rad * -lng,
		phi = rad * lat,
		J   = dateToJulianDate(date),
		M   = getSolarMeanAnomaly(J),
		C   = getEquationOfCenter(M),
		Ls  = getEclipticLongitude(M, C),
		d   = getSunDeclination(Ls),
		a   = getRightAscension(Ls),
		th  = getSiderealTime(J, lw),
		H   = th - a;

	return {
		azimuth:  getAzimuth(H,  phi, d),
		altitude: getAltitude(H, phi, d)
	};
}
