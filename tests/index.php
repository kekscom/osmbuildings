<!DOCTYPE html>
<html>
<head>
    <title>OSM Buildings - Sandbox</title>
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <style type="text/css">
    html, body {
        border: 0;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    #map {
        height: 100%;
    }
    </style>
    <link rel="stylesheet" href="leaflet-0.5.1/leaflet.css">
    <script src="leaflet-0.5.1/leaflet-src.js"></script>
	<script src="scripts.js.php"></script>
</head>

<body>
    <div id="map"></div>


    <script>
    var map = new L.Map('map').setView([52.52179, 13.39503], 18); // Berlin Bodemuseum
//  var map = new L.Map('map').setView([52.50557, 13.33451], 17); // Berlin Ku'Damm
//  var map = new L.Map('map').setView([52.52079, 13.40882], 16); // Berlin Fernsehturm
//  var map = new L.Map('map').setView([37.78923, -122.40597], 16); // SF

    new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', { maxZoom: 18 }).addTo(map);
//  new L.TileLayer('http://{s}.tiles.mapbox.com/v3/osmbuildings.map-c8zdox7m/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    var osmb = new L.BuildingsLayer().addTo(map).load();
// INSERT INTO buildings (the_geom, height) SELECT the_geom, CAST(REPLACE(height, 'm', '') AS int) FROM map_polygon WHERE building IS NOT NULL;
//  var osmb = new L.BuildingsLayer().addTo(map).load('http://osmbuildings.cartodb.com/api/v2/sql?q=' + ('SELECT cartodb_id AS id, height, ST_AsText(ST_MakePolygon(ST_ExteriorRing(ST_GeometryN(the_geom, 1)))) AS the_geom FROM buildings WHERE the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point({w}, {s}), ST_Point({e}, {n})), 4326)') + '&format=geojson');
//  var osmb = new L.BuildingsLayer().addTo(map).load('http://osmbuildings.cartodb.com/api/v2/sql?q=' + ('SELECT cartodb_id AS id, height, ST_AsText(the_geom) AS the_geom FROM buildings WHERE the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point({w}, {s}), ST_Point({e}, {n})), 4326)') + '&format=geojson');

    L.control.layers({}, { Buildings: osmb }).addTo(map);
    </script>

</body>
</html>