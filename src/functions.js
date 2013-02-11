        function createCanvas(parentNode) {
            canvas = doc.createElement('CANVAS');
            canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
            canvas.style.imageRendering = 'optimizeSpeed';
            canvas.style.position = 'absolute';
            canvas.style.pointerEvents = 'none';
            canvas.style.left = 0;
            canvas.style.top = 0;
            parentNode.appendChild(canvas);

            context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 1;

            try {
                context.mozImageSmoothingEnabled = false;
            } catch (err) {
            }

            return canvas;
        }

        function destroyCanvas() {
            canvas.parentNode.removeChild(canvas);
        }

        function pixelToGeo(x, y) {
            var res = {};
            x /= size;
            y /= size;
            res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : RAD * (2 * atan(exp(PI * (1 - 2 * y))) - HALF_PI),
            res[LON] = (x === 1 ?  1 : (x % 1 + 1) % 1) * 360 - 180;
            return res;
        }

        function geoToPixel(lat, lon) {
            var latitude = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
                longitude = lon / 360 + 0.5
            ;
            return {
                x: longitude * size << 0,
                y: latitude  * size << 0
            };
        }



var m = Math, sin = m.sin, cos = Math.cos, rad = m.PI / 180;

var dayMs = 1000 * 60 * 60 * 24,
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
function getEclipticLongitude(M, C) { return M + P + C + m.PI; }
function getSunDeclination(Ls) { return m.asin(sin(Ls) * sin(e)); }
function getRightAscension(Ls) { return m.atan2(sin(Ls) * cos(e), cos(Ls)); }
function getSiderealTime(J, lw) { return th0 + th1 * (J - J2000) - lw; }
function getAzimuth(H, phi, d) { return m.atan2(sin(H), cos(H) * sin(phi) - m.tan(d) * cos(phi)); }
function getAltitude(H, phi, d) { return m.asin(sin(phi) * sin(d) + cos(phi) * cos(d) * cos(H)); }

var getSunPosition = function (date, lat, lng) {
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
};


        function template(str, data) {
            return str.replace(/\{ *([\w_]+) *\}/g, function (x, key) {
                return data[key];
            });
        }
