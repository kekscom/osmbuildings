var Data = (function() {

    var _url,
        _isStatic,
        _staticData,
        _currentItemsIndex = {}; // maintain a list of cached items in order to avoid duplicates on tile borders

    function _getSimpleFootprint(polygon) {
        var footprint = new Int32Array(polygon.length),
            px;
        for (var i = 0, il = polygon.length-1; i < il; i+=2) {
            px = geoToPixel(polygon[i], polygon[i+1]);
            footprint[i]   = px.x;
            footprint[i+1] = px.y;
        }
        footprint = simplify(footprint);
        if (footprint.length < 8) { // 3 points + end==start (*2)
            return;
        }
        return footprint;
    }

    function _createClosure(cacheKey) {
        return function(data) {
            var parsedData = _parse(data);
            Cache.add(parsedData, cacheKey);
            _addRenderItems(parsedData, true);
        };
    }

    function _parse(data) {
        if (!data) {
            return [];
        }
        if (data.type === 'FeatureCollection') {
            return readGeoJSON(data.features);
        }
        if (data.osm3s) { // XAPI
            return readOSMXAPI(data.elements);
        }
        return [];
    }

    function _resetItems() {
        renderItems = [];
        _currentItemsIndex = {};
    }

    function _addRenderItems(data, allAreNew) {
        var scaledItems = _scale(data, zoom),
            item;
        for (var i = 0, il = scaledItems.length; i < il; i++) {
            item = scaledItems[i];
            if (!_currentItemsIndex[item.id]) {
                item.scale = allAreNew ? 0 : 1;
                renderItems.push(item);
                _currentItemsIndex[item.id] = 1;
            }
        }
        fadeIn();
    }

    function _scale(items, zoom) {
        var i, il, j, jl,
            res = [],
            item,
            height, minHeight, footprint,
            color, wallColor, altColor,
            roofColor, roofHeight,
            holes, innerFootprint,
            zoomDelta = maxZoom-zoom,
            meterToPixel = 156412 / Math.pow(2, zoom) / 1.5; // http://wiki.openstreetmap.org/wiki/Zoom_levels, TODO: without factor 1.5, numbers don't match (lat/lon: Berlin)

        for (i = 0, il = items.length; i < il; i++) {
            item = items[i];

            height = item.height >>zoomDelta;

            minHeight = item.minHeight >>zoomDelta;
            if (minHeight > maxHeight) {
                continue;
            }

            if (!(footprint = _getSimpleFootprint(item.footprint))) {
                continue;
            }

            holes = [];
            if (item.holes) {
                for (j = 0, jl = item.holes.length; j < jl; j++) {
                    if ((innerFootprint = _getSimpleFootprint(item.holes[j]))) {
                        holes.push(innerFootprint);
                    }
                }
            }

            wallColor = null;
            altColor  = null;
            if (item.wallColor) {
                if ((color = Color.parse(item.wallColor))) {
                    wallColor = color.setAlpha(zoomAlpha);
                    altColor  = '' + wallColor.setLightness(0.8);
                    wallColor = '' + wallColor;
                }
            }

            roofColor = null;
            if (item.roofColor) {
                if ((color = Color.parse(item.roofColor))) {
                    roofColor = '' + color.setAlpha(zoomAlpha);
                }
            }

            roofHeight = item.roofHeight >>zoomDelta;

            // TODO: move buildings without height to FlatBuildings
            if (height <= minHeight && roofHeight <= 0) {
                continue;
            }

            res.push({
                id:         item.id,
                footprint:  footprint,
                height:     min(height, maxHeight),
                minHeight:  minHeight,
                wallColor:  wallColor,
                altColor:   altColor,
                roofColor:  roofColor,
                roofShape:  item.roofShape,
                roofHeight: roofHeight,
                center:     getCenter(footprint),
                holes:      holes.length ? holes : null,
                shape:      item.shape, // TODO: drop footprint
                radius:     item.radius/meterToPixel
            });
        }

        return res;
    }

    var me = {};

    me.set = function(data) {
        _isStatic = true;
        _resetItems();
        _addRenderItems(_staticData = _parse(data), true);
    };

    me.load = function(url) {
        _url = url || OSM_XAPI_URL;
        _isStatic = !/(.+\{[nesw]\}){4,}/.test(_url);

        if (_isStatic) {
            _resetItems();
            xhr(_url, {}, function(data) {
                _addRenderItems(_staticData = _parse(data), true);
            });
            return;
        }

        me.update();
    };

    me.update = function() {
        _resetItems();

        if (zoom < MIN_ZOOM) {
            return;
        }

        if (_isStatic) {
            _addRenderItems(_staticData);
            return;
        }

        if (!_url) {
            return;
        }

        var lat, lon,
            parsedData, cacheKey,
            nw = pixelToGeo(originX,       originY),
            se = pixelToGeo(originX+width, originY+height),
            sizeLat = DATA_TILE_SIZE,
            sizeLon = DATA_TILE_SIZE*2;

        var bounds = {
            n: ceil( nw.latitude /sizeLat) * sizeLat,
            e: ceil( se.longitude/sizeLon) * sizeLon,
            s: floor(se.latitude /sizeLat) * sizeLat,
            w: floor(nw.longitude/sizeLon) * sizeLon
        };

        for (lat = bounds.s; lat <= bounds.n; lat += sizeLat) {
            for (lon = bounds.w; lon <= bounds.e; lon += sizeLon) {
                lat = crop(lat);
                lon = crop(lon);
                cacheKey = lat + ',' + lon;
                if ((parsedData = Cache.get(cacheKey))) {
                    _addRenderItems(parsedData);
                } else {
                    xhr(_url, {
                        n: lat+sizeLat,
                        e: lon+sizeLon,
                        s: lat,
                        w: lon
                    }, _createClosure(cacheKey));
                }
            }
        }

        Cache.purge();
    };

    return me;

}());
