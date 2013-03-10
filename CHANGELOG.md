# Changelog

## v0.1.8a @ 2013-03-10

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


## v0.1.7a @ 2012-10-10

- adding OpenLayers support, credits to Jérémy Judéaux (https://github.com/Volune)
- aligning Layer naming convention to engines
- fixing some rare cases where layer got removed


## v0.1.6a @ 2012-09-04

- GeoJSON: min zoom removed
- GeoJSON: height property re-enabled
- GeoJSON: multi polygons enabled
- Examples are rebuilt entirely
- Roof colors are re-enbled
- JSHint is now part of the build process


## v0.1.5a

- support for GeoJSON improved
- deep integration with Leaflet in order to avoid jittery movement
- enabled individual building colors
- polygon winding fixed


## v0.1a

- GeoJSON support added
- method chaining added
- adding converter PostGIS > MySQL
- data for Frankfurt added
- made either MySQL or PostGIS (Mapnik) fully configurable
- lat/lon order of your coordinates is configurable
- polygon direction is forced to be clockwise
- simpler initialization process
