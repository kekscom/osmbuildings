    function distance(a, b) {
        var
            dx = a[0] - b[0],
            dy = a[1] - b[1]
        ;
        return sqrt(dx * dx + dy * dy);
    }

    function getCenter(points) {
        var
            i, il,
            x = 0, y = 0
        ;
        for (i = 0, il = points.length - 1; i < il; i += 2) {
//          x += points[i] - offX;
//          y += points[i + 1] - offY;
            x += points[i];
            y += points[i + 1];
        }
        return [ ~~(x/il), ~~(y/il) ];
    }

    function template(str, data) {
        return str.replace(/\{ *([\w_]+) *\}/g, function(x, key) {
            return data[key] || '';
        });
    }

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

    // detect polygon winding direction: clockwise or counter clockwise
    function getPolygonWinding(points) {
        var
            x1, y1, x2, y2,
            a = 0,
            i, il
        ;
        for (i = 0, il = points.length - 3; i < il; i += 2) {
            x1 = points[i    ];
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
            propHeight, color,
            lat = isLonLat ? 1 : 0,
            lon = isLonLat ? 0 : 1,
            alt = 2,
            item
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
            color = Color.parse(properties.color || properties.style.fillColor);

            for (i = 0, il = polygons.length; i < il; i++) {
                coords = polygons[i][0];
                footprint = [];
                heightSum = 0;
                for (j = 0, jl = coords.length; j < jl; j++) {
                    footprint.push(coords[j][lat], coords[j][lon]);
                    heightSum += propHeight || coords[j][alt] || 0;
                }

                if (heightSum) {
                    item = [];
                    item[HEIGHT] = ~~(heightSum/coords.length);
                    item[FOOTPRINT] = makeClockwiseWinding(footprint);
                    if (color) {
                        item[COLOR] = [color, color.adjustLightness(0.2)];
                    }
                    res.push(item);
                }
            }
        }

        return res;
    }