        function xhr(url, callback) {
            var x = new XMLHttpRequest();
            x.onreadystatechange = function () {
                if (x.readyState !== 4) {
                    return;
                }
                if (!x.status || x.status < 200 || x.status > 299) {
                    return;
                }
                if (x.responseText) {
                    callback(JSON.parse(x.responseText));
                }
            };
            x.open('GET', url);
            x.send(null);
            return x;
        }

        function loadData() {
            if (!url || zoom < MIN_ZOOM) {
                return;
            }
            var
                // create bounding box of double viewport size
                nw = pixelToGeo(originX         - halfWidth, originY          - halfHeight),
                se = pixelToGeo(originX + width + halfWidth, originY + height + halfHeight)
            ;
            if (req) {
                req.abort();
            }
            req = xhr(template(url, {
                w: nw[LON],
                n: nw[LAT],
                e: se[LON],
                s: se[LAT],
                z: zoom
            }), onDataLoaded);
        }

        function onDataLoaded(res) {
            var
                i, il,
                resData, resMeta,
                keyList = [], k,
                offX = 0, offY = 0,
                item
            ;

            minZoom = MIN_ZOOM;
            setZoom(zoom); // recalculating all zoom related variables
            req = null;

            // no response or response not matching current zoom (too old response)
            if (!res || res.meta.z !== zoom) {
                return;
            }

            resMeta = res.meta;
            resData = res.data;

            // offset between old and new data set
            if (meta && data && meta.z === resMeta.z) {
                offX = meta.x - resMeta.x;
                offY = meta.y - resMeta.y;

                // identify already present buildings to fade in new ones
                for (i = 0, il = data.length; i < il; i++) {
                    // id key: x,y of first point - good enough
                    keyList[i] = (data[i][FOOTPRINT][0] + offX) + ',' + (data[i][FOOTPRINT][1] + offY);
                }
            }

            meta = resMeta;
            data = [];
            for (i = 0, il = resData.length; i < il; i++) {
                item = parsePolygon(resData[i][FOOTPRINT]);
                if (!item) {
                    continue;
                }
                item[HEIGHT] = min(resData[i][HEIGHT], MAX_HEIGHT);
                k = item[FOOTPRINT][0] + ',' + item[FOOTPRINT][1];
                item[IS_NEW] = !(keyList && ~keyList.indexOf(k));

                item[COLOR] = [];
                item[RENDERCOLOR] = [];

                data.push(item);
            }
            resMeta = resData = keyList = null; // gc
            fadeIn();
        }

        function parsePolygon(points) {
            var item = [],
                len,
                x, y,
                cx = 0, cy = 0
            ;

            points = simplify(points);
            if (points.length < 8) { // 3 points & end = start (x2)
                return;
            }

            // makeClockwiseWinding

            // get center
            for (var i = 0, il = points.length - 3; i < il; i += 2) {
                x = points[i];
                y = points[i + 1];
                cx += x;
                cy += y;
            }

            len = (points.length - 2) * 2,

            item[FOOTPRINT] = points;
            item[CENTER]    = [cx / len << 0, cy / len << 0];

            return item;
        }

        // detect polygon winding direction: clockwise or counter clockwise
        function getPolygonWinding(points) {
            var
                x1, y1, x2, y2,
                a = 0,
                i, il
            ;
            for (i = 0, il = points.length - 3; i < il; i += 2) {
                x1 = points[i];
                y1 = points[i + 1];
                x2 = points[i + 2];
                y2 = points[i + 3];
                a += x1 * y2 - x2 * y1;
            }
            return (a / 2) > 0 ? 'CW' : 'CCW';
        }

        // make polygon winding clockwise. This is needed for proper backface culling on client side.
        function makeClockwiseWinding(points) {
            var winding = getPolygonWinding(points);
            if (winding === 'CW') {
                return points;
            }
            var revPoints = [];
            for (var i = points.length - 2; i >= 0; i -= 2) {
                revPoints.push(points[i], points[i + 1]);
            }
            return revPoints;
        }

        function scaleData(data, isNew) {
            var
                res = [],
                i, il, j, jl,
                item,
                coords, footprint,
                p,
                z = maxZoom - zoom
            ;

            for (i = 0, il = data.length; i < il; i++) {
                item = data[i];
                coords = item[FOOTPRINT];
                footprint = new Int32Array(coords.length);
                for (j = 0, jl = coords.length - 1; j < jl; j += 2) {
                    p = geoToPixel(coords[j], coords[j + 1]);
                    footprint[j]     = p.x;
                    footprint[j + 1] = p.y;
                }
                res[i] = [];
                res[i][HEIGHT]    = min(item[HEIGHT] >> z, MAX_HEIGHT);
                res[i][FOOTPRINT] = footprint;
                res[i][CENTER]    = item[CENTER];
                res[i][COLOR]     = item[COLOR];
                res[i][IS_NEW]    = isNew;
            }

            return res;
        }

        function geoJSON(url, isLatLon) {
            if (typeof url === 'object') {
                setData(url, !isLatLon);
                return;
            }
            var
                el = doc.documentElement,
                callback = 'jsonpCallback',
                script = doc.createElement('script')
            ;
            global[callback] = function (res) {
                delete global[callback];
                el.removeChild(script);
                setData(res, !isLatLon);
            };
            el.insertBefore(script, el.lastChild).src = url.replace(/\{callback\}/, callback);
        }

        function parseGeoJSON(json, isLonLat, res) {
            if (res === undefined) {
                res = [];
            }

            var
                i, il,
                j, jl,
                features = json[0] ? json : json.features,
                geometry, polygons, coords, properties,
                footprint, heightSum,
                propHeight, propWallColor, propRoofColor,
                lat = isLonLat ? 1 : 0,
                lon = isLonLat ? 0 : 1,
                alt = 2,
                item,
                x, y, cx, cy
            ;

            if (features) {
                for (i = 0, il = features.length; i < il; i++) {
                    parseGeoJSON(features[i], isLonLat, res);
                }
                return res;
            }

            if (json.type === 'Feature') {
                geometry = json.geometry;
                properties = json.properties;
            }
        //      else geometry = json

            if (geometry.type === 'Polygon') {
                polygons = [geometry.coordinates];
            }
            if (geometry.type === 'MultiPolygon') {
                polygons = geometry.coordinates;
            }

            if (polygons) {
                propHeight = properties.height;
                if (properties.color || properties.wallColor) {
                    propWallColor = Color.parse(properties.color || properties.wallColor);
                }
                if (properties.roofColor) {
                    propRoofColor = Color.parse(properties.roofColor);
                }

                cx = 0;
                cy = 0;
                for (i = 0, il = polygons.length; i < il; i++) {
                    coords = polygons[i][0];
                    footprint = [];
                    heightSum = 0;
                    for (j = 0, jl = coords.length; j < jl; j++) {
                        x = coords[j][lon];
                        y = coords[j][lat];
                        cx += x;
                        cy += y;
                        footprint.push(y, x);
                        heightSum += propHeight || coords[j][alt] || 0;
                    }

                    if (heightSum) {
                        item = [];
                        item[HEIGHT] = heightSum / coords.length << 0;
                        item[FOOTPRINT] = makeClockwiseWinding(footprint);
                        item[CENTER] = [cx / jl << 0, cy / jl << 0];
                        item[COLOR] = [
                            propWallColor || null,
                            propWallColor ? propWallColor.adjustLightness(0.8) : null,
                            propRoofColor ? propRoofColor : propWallColor ? propWallColor.adjustLightness(1.2) : null
                        ];
                        item[RENDERCOLOR] = [];
                        res.push(item);
                    }
                }
            }

            return res;
        }

        function setData(json, isLonLat) {
            if (!json) {
                rawData = null;
                render(); // effectively clears
                return;
            }

            rawData = parseGeoJSON(json, isLonLat);
            data = scaleData(rawData, true);

            minZoom = 0;
            setZoom(zoom); // recalculating all zoom related variables

            meta = {
                n: 90,
                w: -180,
                s: -90,
                e: 180,
                x: 0,
                y: 0,
                z: zoom
            };

            fadeIn();
        }