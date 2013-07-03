<img src="http://osmbuildings.org/logo.png"/>

OSM Buildings is a JavaScript library for visualizing OpenStreetMaps building geometry on interactive maps.<br>
Everything is stabilizing now, entering beta state.


## Running example

http://osmbuildings.org/


## Files

Release version 0.1.8a https://github.com/kekscom/osmbuildings/tree/v0.1.8a<br>
Latest development version https://github.com/kekscom/osmbuildings

For further information visit http://osmbuildings.org, follow [@osmbuildings](https://twitter.com/osmbuildings) on Twitter or report issues here on Github.


## Documentation

### Integration with Leaflet

Link Leaflet and OSM Buildings files in your HTML head section.

~~~ html
<head>
  <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.5.1/leaflet.css">
  <script src="http://cdn.leafletjs.com/leaflet-0.5.1/leaflet.js"></script>
  <script src="L.BuildingsLayer.js"></script>
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
new L.BuildingsLayer().addTo(map).load();
~~~

As a popular alternative, you could pass a <a href="http://www.geojson.org/geojson-spec.html">GeoJSON</a> data object. Make sure the building coordinates are projected in <b><a href="http://spatialreference.org/ref/epsg/4326/">EPSG:4326</a></b>, and the height specified in <b>meters</b>.

~~~ javascript
var data = {
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

new L.BuildingsLayer().addTo(map).geoJSON(data);
~~~


### Integration with OpenLayers

Link OpenLayers and OSM Buildings files in your HTML head section.

~~~ html
<head>
  <script src="http://www.openlayers.org/api/OpenLayers.js"></script>
  <script src="Openlayers.Layer.Buildings.js"></script>
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
var osmb = new OpenLayers.Layer.Buildings();
map.addLayer(osmb);
osmb.load();
~~~


## API

### Constructors

<table>
<tr>
<th>Constructor</th>
<th>Description</th>
</tr>

<tr>
<td>new L.BuildingsLayer()</td>
<td>Initializes the buildings layer for Leaflet.</td>
</tr>

<tr>
<td>new OpenLayers.Layer.Buildings()</td>
<td>Initializes the buildings layer for OpenLayers.</td>
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
<td>setDate(new Date(2013, 15, 1, 10, 30)))</td>
<td>Set date / time for shadow projection.</td>
</tr>

<tr>
<td>geoJSON({Object})</td>
<td>Just add a geoJSON data to your map.</td>
</tr>

<tr>
<td>load({String})</td>
</td>
<td>Without parameter, it loads data tiles from OpenStreetMaps. You don't need to care for data anymore.
As an alternative, pass an URL to <a href="http://cartodb.com/">CartoDB</a>. See below.
</td>
</tr>
</table>

CartoDB URL example

~~~ url
http://<YOUR CARTODB ACCOUNT HERE>.cartodb.com/api/v2/sql?q=' + ('SELECT cartodb_id AS id, height, ST_AsText(ST_MakePolygon(ST_ExteriorRing(ST_GeometryN(the_geom, 1)))) AS the_geom, color FROM map_polygon WHERE the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point({w}, {s}), ST_Point({e}, {n})), 4326)') + '&format=geojson
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
