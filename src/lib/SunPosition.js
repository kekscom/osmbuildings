var getSunPosition = (function () {

    var m = Math,
        sin = m.sin,
        cos = m.cos,
        tan = m.tan,
        asin = m.asin,
        atan2 = m.atan2,
        PI = m.PI,
        RAD = 180 / PI;

    var dayMS = 1000 * 60 * 60 * 24,
        J1970 = 2440588,
        J2000 = 2451545,
        M0    = 357.5291 / RAD,
        M1    = 0.98560028 / RAD,
        C1    = 1.9148 / RAD,
        C2    = 0.0200 / RAD,
        C3    = 0.0003 / RAD,
        P     = 102.9372 / RAD,
        e     = 23.45 / RAD,
        th0   = 280.1600 / RAD,
        th1   = 360.9856235 / RAD;

    function dateToJulianDate(date) {     return date.valueOf() / dayMS - 0.5 + J1970; }
    function getSolarMeanAnomaly(Js) {    return M0 + M1 * (Js - J2000); }
    function getEquationOfCenter(M) {     return C1 * sin(M) + C2 * sin(2 * M) + C3 * sin(3 * M); }
    function getEclipticLongitude(M, C) { return M + P + C + PI; }
    function getSunDeclination(Ls) {      return asin(sin(Ls) * sin(e)); }
    function getRightAscension(Ls) {      return atan2(sin(Ls) * cos(e), cos(Ls)); }
    function getSiderealTime(J, lw) {     return th0 + th1 * (J - J2000) - lw; }
    function getAzimuth(H, phi, d) {      return atan2(sin(H), cos(H) * sin(phi) - tan(d) * cos(phi)); }
    function getAltitude(H, phi, d) {     return asin(sin(phi) * sin(d) + cos(phi) * cos(d) * cos(H)); }

    return function (date, lat, lon) {
        var lw  = -lon / RAD,
            phi = lat / RAD,
            J   = dateToJulianDate(date),
            M   = getSolarMeanAnomaly(J),
            C   = getEquationOfCenter(M),
            Ls  = getEclipticLongitude(M, C),
            d   = getSunDeclination(Ls),
            a   = getRightAscension(Ls),
            th  = getSiderealTime(J, lw),
            H   = th - a;

        return {
            altitude: getAltitude(H, phi, d),
            azimuth:  getAzimuth(H,  phi, d) - PI / 2 // origin: north
        };
    };
})();