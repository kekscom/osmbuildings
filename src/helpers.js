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
            revPoints.push(points[i]);
            revPoints.push(points[i + 1]);
        }
        return revPoints;
    }

    function parseGeoJSON(json, isLonLat, res) {
        if (res === undefined) {
            res = [];
        }

        var
            features = json[0] ? json : json.features,
            geometry, coords, properties,
            footprint, heightSum,
            color,
            i, il,
            lat = isLonLat ? 1 : 0,
            lon = isLonLat ? 0 : 1,
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
    //    else geometry = json

        if (geometry.type == 'Polygon') {
            coords = geometry.coordinates[0];
            footprint = [];
            heightSum = 0;
            for (i = 0, il = coords.length; i < il; i++) {
                footprint.push(coords[i][lat]);
                footprint.push(coords[i][lon]);
                heightSum += coords[i][2] || 0;
            }

            if (heightSum) {
                item = [];
                item[HEIGHT]    = ~~(heightSum/coords.length);
                item[FOOTPRINT] = makeClockwiseWinding(footprint);
                if (properties.color) {
                    color = Color.parse(properties.color);
                    item[COLOR] = [color, color.adjustLightness(0.2)];
                }
                res.push(item);
            }
        }

        return res;
    }