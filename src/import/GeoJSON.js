var readGeoJSON = function(collection) {
    var i, il, j, jl, k, kl,
        res = [],
        feature,
        geometry, properties, coordinates,
        wallColor, roofColor,
        last,
        polygon, footprint, holes,
        lat = 1, lon = 0,
        item;

    for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];
        if (feature.type !== 'Feature') {
            continue;
        }

        geometry = feature.geometry;
        properties = feature.properties;

        if (geometry.type === 'LineString') {
            last = coordinates.length-1;
            if (coordinates[0][0] === coordinates[last][0] && coordinates[0][1] === coordinates[last][1]) {
                coordinates = geometry.coordinates;
            }
        }

        if (geometry.type === 'Polygon') {
            coordinates = geometry.coordinates;
        }

        // just use the outer ring
        if (geometry.type === 'MultiPolygon') {
            coordinates = geometry.coordinates[0];
        }

        if (!coordinates) {
            continue;
        }

        if (properties.color || properties.wallColor) {
            wallColor = properties.color || properties.wallColor;
        }

        if (properties.roofColor) {
            roofColor = properties.roofColor;
        }

        polygon   = coordinates[0];
        footprint = [];
        for (j = 0, jl = polygon.length; j < jl; j++) {
            footprint.push(polygon[j][lat], polygon[j][lon]);
        }

        holes = [];
        for (j = 1, jl = coordinates.length; j < jl; j++) {
            polygon = coordinates[j];
            holes[j-1] = [];
            for (k = 0, kl = polygon.length; k < kl; k++) {
                holes[j-1].push(polygon[k][lat], polygon[k][lon]);

            }
            holes[j-1] = Import.windInnerPolygon(holes[j-1]);
        }

        // one item per coordinates ring (usually just one ring)
        item = {
            id:properties.id || (footprint[0] + ',' + footprint[1]),
            footprint:Import.windOuterPolygon(footprint)
        };

        if (properties.height)    item.height    = Import.getDimension(properties.height);
        if (properties.minHeight) item.minHeight = Import.getDimension(properties.minHeight);
        if (wallColor)            item.wallColor = wallColor;
        if (roofColor)            item.roofColor = roofColor;
        if (holes.length)         item.holes     = holes;
        res.push(item);
    }

    return res;
};
