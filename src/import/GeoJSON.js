var importGeoJSON = (function() {

  function getPolygons(geometry) {
    var
      i, il, j, jl,
      polygon,
      p, lat = 1, lon = 0, alt = 2,
      outer = [], inner = [], height = 0,
      res = [];

    switch (geometry.type) {
      case 'GeometryCollection':
        var sub;
        for (i = 0, il = geometry.geometries.length; i < il; i++) {
          if ((sub = getPolygons(geometry.geometries[i]))) {
            res = res.concat(sub);
          }
        }
        return res;

      case 'Polygon':
        polygon = geometry.coordinates;
      break;

      case 'MultiPolygon':
        polygon = geometry.coordinates[0];
      break;

      default: return res;
    }

    p = polygon[0];
    for (i = 0, il = p.length; i < il; i++) {
      outer.push(p[i][lat], p[i][lon]);
      if (p[i][alt] !== undefined) {
        height += p[i][alt];
      }
    }

    for (i = 0, il = polygon.length-1; i < il; i++) {
      p = polygon[i+1];
      inner[i] = [];
      for (j = 0, jl = p.length; j < jl; j++) {
        inner[i].push(p[j][lat], p[j][lon]);
      }
      inner[i] = Import.makeWinding(inner[i], Import.counterClockwise);
    }

    return [{
      outer: Import.makeWinding(outer, Import.clockwise),
      inner: inner.length ? inner : null,
      height: height / polygon[0].length
    }];
  }

  return function(collection, callback) {
    var
      i, il, j, jl,
      res = [],
      feature,
      properties,
      polygons, outer,
      height, minHeight, wallColor, roofColor;

    for (i = 0, il = collection.length; i < il; i++) {
      feature = collection[i];

      if (feature.type !== 'Feature' || callback(feature) === false) {
        continue;
      }

      properties = feature.properties;

      height    = Import.toMeters(properties.height) || DEFAULT_HEIGHT;
      minHeight = Import.toMeters(properties.minHeight);
      wallColor = properties.color || properties.wallColor || null;
      roofColor = properties.roofColor || null;

      polygons = getPolygons(feature.geometry);

      for (j = 0, jl = polygons.length; j < jl; j++) {
        outer = polygons[j].outer;
        res.push({
          footprint: outer,
          holes:     polygons[j].inner,
          height:    height || polygons[j].height,
          id:        feature.id || properties.id || [outer[0], outer[1], height, minHeight].join(','),
          minHeight: minHeight,
          wallColor: wallColor,
          roofColor: roofColor
        });
      }
    }

    return res;
  };
}());
