
        var shadowOriginX, shadowOriginY,
            shadowBuffer,
            shadowAlpha = 1,
            shadowLength = -1,
            shadowX = 0, shadowY = 0;

        function setDate(date) {
            var center, sunPos;

            if (!date) {
                return;
            }

            center = pixelToGeo(originX + halfWidth, originY + halfHeight),
            sunPos = getSunPosition(date, center.latitude, center.longitude);

            if (sunPos.altitude <= 0) {
                shadowLength = -1;
                shadowAlpha = fromRange(-sunPos.altitude, 0, 1, 0.1, 0.8);
            } else {
                shadowLength = 1 / tan(sunPos.altitude);
                shadowAlpha = 0.4 / shadowLength;
                shadowX = cos(sunPos.azimuth) * shadowLength;
                shadowY = sin(sunPos.azimuth) * shadowLength;
            }

            shadowColor.a = shadowAlpha;
            shadowColorAlpha = shadowColor + '';

            shadowBuffer = null;
            render();
        }

        function drawShadows() {
            if (shadowBuffer) {
                context.drawImage(shadowBuffer, shadowOriginX - originX, shadowOriginY - originY);
                return;
            }

            createShadows();
            shadowOriginX = originX;
            shadowOriginY = originY;
        }

        function createShadows() {
            var i, il, j, jl,
                item,
                f, h,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                footprint,
                mode,
                isVisible,
                ax, ay, bx, by,
                a, b, _a, _b,
                grounds = []
            ;

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

                // prepare same calculations for min_height if applicable
                if (item[MIN_HEIGHT]) {
                    //h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
                    h = item[MIN_HEIGHT];
                }

                mode = null;
                context.beginPath();

                for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                    ax = footprint[j];
                    ay = footprint[j + 1];
                    bx = footprint[j + 2];
                    by = footprint[j + 3];

                    _a = projectShadow(ax, ay, h);
                    _b = projectShadow(bx, by, h);

                    if (item[MIN_HEIGHT]) {
                        a = projectShadow(ax, ay, h);
                        b = projectShadow(bx, by, h);
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

        function projectShadow(x, y, h) {
            return {
                x: x + shadowX * h,
                y: y + shadowY * h
            };
        }

        function filterShadows() {
            var buffer = context.getImageData(0, 0, width, height),
                pixels = buffer.data,
                blendAlpha = shadowAlpha * 255 <<0,
                maxAlpha = 255,
                r, a;

            for (var i = 0, il = pixels.length; i < il; i += 4) {
                r = pixels[i + 0];
                a = pixels[i + 3];
                // make everything with color and maximum alpha fully transparent
                if (r && a >= maxAlpha) {
                    pixels[i + 3] = 0;
                } else
                // reduce higher alpha values to max shadow color alpha
                // this removes dark overlapping areas in shadows but keeps all anti aliasing
                if (a > blendAlpha) {
                    pixels[i + 3] = blendAlpha;
                }
            }

            context.putImageData(buffer, 0, 0);
        }

        var dayMS = 1000 * 60 * 60 * 24,
            J1970 = 2440588,
            J2000 = 2451545,
            M0    = 357.5291 / RAD,
            M1    = 0.98560028 / RAD,
            J0    = 0.0009,
            J1    = 0.0053,
            J2    = -0.0069,
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

        function getSunPosition(date, lat, lng) {
            var lw  = -lng / RAD,
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
        }
