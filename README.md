<img src="http://osmbuildings.org/logo.png"/>

OSM Buildings is a JavaScript library for visualizing OpenStreetMaps building geometry on interactive maps.<br>
Everything is stabilizing now, entering beta state.


## Example

http://osmbuildings.org/


## Deprecation notice!

By version 0.1.9a, there are a few important changes regarding files and API.<br>
It's about aligning, functionality stays the same.

1. Files are now named `OSMBuildings-<ENGINE>.js`- where engine is `Leaflet` or `OpenLayers` at the moment.
2. Initialization is just `new OSMBuildings(map)` - no more addTo(...)
3. Loading data from external GeoJSON source is done via `loadData(<URL>)`
3. Setting GeoJSON or alike formatted data is done by `setData(<DATA>)`

For details, see documentation below.


## Files

Release version 0.1.9a https://github.com/kekscom/osmbuildings/tree/v0.1.9a<br>
Latest development version https://github.com/kekscom/osmbuildings

For further information visit http://osmbuildings.org, follow [@osmbuildings](https://twitter.com/osmbuildings) on Twitter or report issues here on Github.


## Documentation

### Integration with Leaflet

Link Leaflet and OSM Buildings files in your HTML head section.

~~~ html
<head>
  <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.7/leaflet.css">
  <script src="http://cdn.leafletjs.com/leaflet-0.7/leaflet.js"></script>
  <script src="OSMBuildings-Leaflet.js"></script>
</head>
~~~

Initialize the map engine and add a map tile layer.<br>
Position is set to Berlin at zoom level 17, I'm using MapBox tiles here.

~~~ javascript
var map = new L.Map('map').setView([52.52020, 13.37570], 17);
new L.TileLayer('http://{s}.tiles.mapbox.com/v3/<YOUR MAPBOX KEY HERE>/{z}/{x}/{y}.png',
  { attribution: 'Map tiles &copy; <a href="http://mapbox.com">MapBox</a>', maxZoom: 17 }).addTo(map);
~~~

Add the buildings layer.

~~~ javascript
new OSMBuildings(map).loadData();
~~~

As a popular alternative, you could pass a <a href="http://www.geojson.org/geojson-spec.html">GeoJSON</a> FeatureCollection object.<br>
Feature types Polygon, Multipolygon and Linestring are supported.<br>
Make sure the building coordinates are projected in <a href="http://spatialreference.org/ref/epsg/4326/">EPSG:4326</a>.<br>
Height units m, ft, yd, mi are accepted, no given unit defaults to meters.

~~~ javascript
var geoJSON = {
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [13.37356, 52.52064],
        [13.37350, 52.51971],
        [13.37664, 52.51973],
        [13.37594, 52.52062],
        [13.37356, 52.52064]
      ]]
    },
    "properties": {
      "wallColor": "rgb(255,0,0)",
      "roofColor": "rgb(255,128,0)",
      "height": 500,
      "minHeight": 0
    }
  }]
};

new OSMBuildings(map).setData(geoJSON);
~~~


### Integration with OpenLayers

Link OpenLayers and OSM Buildings files in your HTML head section.

~~~ html
<head>
  <script src="http://www.openlayers.org/api/OpenLayers.js"></script>
  <script src="OSMBuildings-OpenLayers.js"></script>
</head>
~~~

Initialize the map engine and add a map tile layer.<br>
Position is set to Berlin at zoom level 17.

~~~ javascript
var map = new OpenLayers.Map('map');
map.addControl(new OpenLayers.Control.LayerSwitcher());

var osm = new OpenLayers.Layer.OSM();
map.addLayer(osm);

map.setCenter(
  new OpenLayers.LonLat(13.37570, 52.52020)
    .transform(
      new OpenLayers.Projection('EPSG:4326'),
      map.getProjectionObject()
    ),
  17
);
~~~

Add the buildings layer.

~~~ javascript
new OSMBuildings(map).loadData();
~~~


## API

### Constructors

<table>
<tr>
<th>Constructor</th>
<th>Description</th>
</tr>

<tr>
<td>new OSMBuildings(map)</td>
<td>Initializes the buildings layer for a given map engine.<br>
Currently Leaflet and OpenLayers are supported.</td>
</tr>
</table>

Constants

<table>
<tr>
<th>Option</th>
<th>Type</th>
<th>Description</th>
</tr>

<tr>
<td>ATTRIBUTION</td>
<td>String</td>
<td>Holds OSM Buildings copyright information.</td>
</tr>

<tr>
<td>VERSION</td>
<td>String</td>
<td>Holds current version information.</td>
</tr>
</table>

Methods

<table>
<tr>
<th>Method</th>
<th>Description</th>
</tr>

<tr>
<td>setStyle({Object})</td>
<td>Set default styles. See below for details.</td>
</tr>

<tr>
<td>setDate(new Date(2014, 15, 1, 10, 30)))</td>
<td>Set date / time for shadow projection.</td>
</tr>

<tr>
<td>each({Function})</td>
<td>A callback method to override each feature's properties on read. Return false in order to skip a feature.</td>
</tr>

<tr>
<td>setData({GeoJSON FeatureCollection})</td>
<td>Just add GeoJSON data to your map.</td>
</tr>

<tr>
<td>loadData({String})</td>
</td>
<td>Without parameter, it loads data tiles from OpenStreetMaps. You don't need to care for data anymore.
As an alternative, pass an URL to <a href="http://cartodb.com/">CartoDB</a> or any other GeoJSON service. See below.
</td>
</tr>
</table>

CartoDB URL example

~~~ url
http://<YOUR CARTODB ACCOUNT HERE>.cartodb.com/api/v2/sql?q=' + ('SELECT cartodb_id AS id, height, ST_AsText(the_geom) AS the_geom FROM <YOURTABLE> WHERE the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point({w},{s}), ST_Point({e},{n})), 4326)') + '&format=geojson');
~~~


Styles

<table>
<tr>
<th>Option</th>
<th>Type</th>
<th>Description</th>
</tr>

<tr>
<td>color or <br>
wallColor</td>
<td>String</td>
<td>Defines the objects default primary color. I.e. #ffcc00, rgb(255,200,200), rgba(255,200,200,0.9)</td>
</tr>

<tr>
<td>roofColor</td>
<td>String</td>
<td>Defines the objects default roof color.</td>
</tr>

<tr>
<td>shadows</td>
<td>Boolean</td>
<td>Enables or disables shadow rendering, default: enabled</td>
</tr>
</table>


## Data

### OSM Tags used

<table>
<tr>
<th>Result</th>
<th>OSM Tags</th>
</tr>

<tr>
<td><b>height</b></td>
<td>height, building:height, levels, building:levels</td>
</tr>

<tr>
<td><b>minHeight</b></td>
<td>min_height, building:min_height, min_level, building:min_level</td>
</tr>

<tr>
<td><b>wallColor</b></td>
<td>building:color, building:colour, building:material, building:facade:material, building:cladding</td>
</tr>

<tr>
<td><b>roofColor</b></td>
<td>roof:color, roof:colour, building:roof:color, building:roof:colour, roof:material, building:roof:material</td>
</tr>

<tr>
<td><b>shape</b></td>
<td>building:shape[=cylinder,sphere]</td>
</tr>

<tr>
<td><b>roofShape</b></td>
<td>roof:shape[=dome]</td>
</tr>

<tr>
<td><b>roofHeight</b></td>
<td>roof:height</td>
</tr>
</table>
