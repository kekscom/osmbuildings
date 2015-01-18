# Changelog

## 0.2.2b @ 2014-11-25

**Features**

- detection for circular objects

**Fixes**

- several fixes for radius handling
- several click-hit issues fixed


## 0.2.1b @ 2014-09-24

**Features**

- pyramidal buildungs and roofs
- buildings parts are a logical unit now (i.e. OSM relations)
- explicitly injecting OSMBuildings class into global namespace [#66](https://github.com/kekscom/osmbuildings/issues/66)


## 0.2.0b @ 2014-09-04

*From this version on, OSM Buildings is entering beta phase \o/*

**Features**

- Buildings are clickable now, use .click(function(featureId) {...})
- Massive improvements in GeoJSON reading, bigger set of properties and GeometryCollections are supported
- Ambient shadows for buildings added
- Introduced a data service for filtering and caching OSM data, results in massive speedup for loading
- Geometry: cones enabled, also used as an interim replacement for domes
- Tested device accelerated perspective aka Amazon's 'Dynamic Perspective', but disabled again in favor for performance
- Successfully tested with LeafletJS 0.8 and OpenLayers 2.13.1
- Code size reduced from 10.23 to 9.44k (all gzipped)

**Fixes**

- Height scale fixed
- Relation properties precedence fixed
- Simple buildings layer refactored
- Flipped perspective on some latitudes fixed
- Tried requestAnimationFrame, but needed to drop again for IE and iOS


## 0.1.9a @ 2013-10-17

- multipolygon support added
- backend removed, now using web services with GeoJSON or OSM Overpass XAPI
- vector data is subdivided into tiles
- data tiles are cached
- fix for chained method calls
- fix for flat buildings from rendering tall buildings too
- min zoom level decreased to 15
- fix for setStyle() removing shadows
- material color mapping added
- HSLA color support added
- support for W3C named colors added
- CORS-XHR support for MSIE added
- cylindric object rendering added
- API is now documented in GitHub README
- map engine adapters simplified
- minHeight and height units for GeoJSON enabled
- very simple fix for building occlusion
- successful tests with LeafletJS 0.6.4


## 0.1.8a @ 2013-03-10

- on layer removal from map, OSM Buildings is not destroyed anymore
- introduced multiple rendering layers
- improved simplification algorithm, inspired by Vladimir Agafonkin (http://mourner.github.com/simplify-js)
- initial version of objects draw order (farthest first, lower first)
- directional wall shading added
- building shadows added
- shadow date / time dependency added, inspired by Vladimir Agafonkin /https://github.com/mourner/suncalc)
- `min_height` support added (requires backend change)
- color / style table handling improved
- rendering tests added
- successful tests with LeafletJS 0.5.1
- recommendation: reduce building `$heightScale` in backend server config down to 1.2


## 0.1.7a @ 2012-10-10

- adding OpenLayers support, credits to Jérémy Judéaux (https://github.com/Volune)
- aligning Layer naming convention to engines
- fixing some rare cases where layer got removed


## 0.1.6a @ 2012-09-04

- GeoJSON: min zoom removed
- GeoJSON: height property re-enabled
- GeoJSON: multi polygons enabled
- Examples are rebuilt entirely
- Roof colors are re-enbled
- JSHint is now part of the build process


## 0.1.5a

- support for GeoJSON improved
- deep integration with Leaflet in order to avoid jittery movement
- enabled individual building colors
- polygon winding fixed


## 0.1.0a

- GeoJSON support added
- method chaining added
- adding converter PostGIS > MySQL
- data for Frankfurt added
- made either MySQL or PostGIS (Mapnik) fully configurable
- lat/lon order of your coordinates is configurable
- polygon direction is forced to be clockwise
- simpler initialization process
