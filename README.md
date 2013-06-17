<img src="http://osmbuildings.org/logo.png"/>

OSM Buildings is a JavaScript library for visualizing 3D OSM building geometry on interactive maps.
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
new L.BuildingsLayer().addTo(map);
~~~

As a popular alternative, you could pass a <a href="http://www.geojson.org/geojson-spec.html">GeoJSON</a> data object.

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
map.addLayer(new OpenLayers.Layer.Buildings());
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
<td>`setStyle({Object})`</td>
<td>Set default styles.</td>
</tr>

<tr>
<td>`setDate(new Date(2013, 15, 1, 10, 30)))`</td>
<td>Set date / time for shadow projection.</td>
</tr>





<tr>
<td>`geoJSON(url {String} | <a href="http://www.geojson.org/geojson-spec.html">GeoJSON</a> {Object}, isLatLon? {Boolean})`</td>
<td>`
geoJSON({
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
})`</td>
<td>The method accepts either a string which is handled as JSONP URL for retrieving GeoJSON data from it.<br>
Or you can pass a common GeoJSON object to it. Supported shape types are Polygon and MultiPolygon.<br>
The isLatLon parameter forces the method to swap coordinates Lon/Lat order.</td>
</tr>
</table>

Styles

<table>
<tr>
<th>Option</th>
<th>Type</th>
<th>Example</th>
<th>Description</th>
</tr>

<tr>
<td>color or <br>
wallColor:</td>
<td>String</td>
<td>`'#ffcc00'
'rgb(255,200,200)'
'rgba(255,200,200,0.9)'`</td>
<td>Define the objects primary color.<br>
Default color is rgb(200,190,180).
If setStyle() has been used to set different global colors, these will be applied.
If color is set in GeoJSON, this will be used with highest priority.
</td>
</tr>

<tr>
<td>roofColor:</td>
<td>String</td>
<td class="api-code">'#ffcc00'
'rgb(255,200,200)'
'rgba(255,200,200,0.9)'</td>
<td>Define the objects alternate color.<br>
    By default, wallColor will be adapted by some different brightness.
    If setStyle() has been used used to set a different global wallColor, this will be applied.
    If roofColor is set in GeoJSON, this will be used with highest priority.
</td>
</tr>
<tr>
    <td>shadows:</td>
    <td>Boolean</td>
    <td class="api-code">true</td>
    <td>Enable or disable shadow rendering.<br>
        By default, it's enabled and depends on viewer's current local time.
    </td>
</tr>
</table>
