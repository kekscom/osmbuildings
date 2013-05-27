// beware, it's not easy to use this standalone
// dependencies to: makeClockwiseWinding() and {materialColors}

var readGeoJSON = function(data, res) {
    var i, il;

    // recursions pass res by reference to be filled
    // finally it's returned by value, so create it on initial call
    if (res === undefined) {
        res = [];
    }

    // recurse into feature collections
    var collection = data[0] ? data : data.features;

    if (collection) {
        for (i = 0, il = collection.length; i < il; i++) {
            readGeoJSON(collection[i], res);
        }
        return res;
    }

    if (data.type !== 'Feature') {
        return res;
    }

    var geometry = data.geometry,
        properties = data.properties,
        coordinates;

    if (geometry.type === 'Polygon') {
        coordinates = [geometry.coordinates];
    }

    if (geometry.type === 'MultiPolygon') {
        coordinates = geometry.coordinates;
    }

    if (!coordinates) {
        return res;
    }

    var colorCode,
        wallColor, roofColor;

    if (properties.color || properties.wallColor) {
        colorCode = properties.color || properties.wallColor;
        wallColor = Color.parse(materialColors[colorCode] || colorCode);
    }

    if (properties.roofColor) {
        colorCode = properties.roofColor;
        roofColor = Color.parse(materialColors[colorCode] || colorCode);
    }

    var height = properties.height,
        polygon, footprint, heightSum,
        j, jl,
        lat = 1, lon = 0, alt = 2;

    for (i = 0, il = coordinates.length; i < il; i++) {
        polygon = coordinates[i][0];
        footprint = [];
        heightSum = 0;
        for (j = 0, jl = polygon.length; j < jl; j++) {
            footprint.push(polygon[j][lat], polygon[j][lon]);
            heightSum += height || polygon[j][alt] || 0;
        }

        if (heightSum) {
            res.push({
                id:        properties.id || (footprint[0] + ',' + footprint[1]),
                footprint: makeClockwiseWinding(footprint),
                height:    (heightSum/polygon.length <<0) || DEFAULT_HEIGHT,
                minHeight: properties.minHeight,
                wallColor: wallColor,
                altColor:  (wallColor && wallColor.adjustLightness(0.8)),
                roofColor: roofColor
            });
        }
    }
    return res;
};
