var readGeoJSON = function(collection) {
    var i, il, j, jl, k, kl,
        res = [],
        feature,
        geometry, properties, coordinates,
        last,
        polygon, footprint, holes,
        lat = 1, lon = 0,
        item;

    for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];

        if (feature.type !== 'Feature') {
            continue;
        }

        item = {};

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

        if (geometry.type === 'MultiPolygon') {
            coordinates = geometry.coordinates[0];
        }

        if (!coordinates) {
            continue;
        }

        polygon = coordinates[0];
        footprint = [];
        for (j = 0, jl = polygon.length; j < jl; j++) {
            footprint.push(polygon[j][lat], polygon[j][lon]);
        }

        item.id = properties.id || [footprint[0], footprint[1], properties.height, properties.minHeight].join(',');
        item.footprint = Import.windOuterPolygon(footprint);

        holes = [];
        for (j = 1, jl = coordinates.length; j < jl; j++) {
            polygon = coordinates[j];
            holes[j-1] = [];
            for (k = 0, kl = polygon.length; k < kl; k++) {
                holes[j-1].push(polygon[k][lat], polygon[k][lon]);

            }
            holes[j-1] = Import.windInnerPolygon(holes[j-1]);
        }

        if (holes.length) {
            item.holes = holes;
        }

        item.height = Import.toMeters(properties.height) || Import.DEFAULT_HEIGHT;

        if (properties.minHeight) {
            item.minHeight = Import.toMeters(properties.minHeight);
        }

        if (properties.color || properties.wallColor) {
            item.wallColor = properties.color || properties.wallColor;
        }

        if (properties.roofColor) {
            item.roofColor = properties.roofColor;
        }

        res.push(item);
    }

    return res;
};
