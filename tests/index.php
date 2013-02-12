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
    <link rel="stylesheet" href="leaflet-0.4.5/leaflet.css">
    <script src="leaflet-0.4.5/leaflet.js"></script>
	<script><?php
	$srcPath = "../src";
	$srcFiles = array(
		$srcPath . "/prefix.js",
		$srcPath . "/shortcuts.js",
		$srcPath . "/lib/Color.js",
		$srcPath . "/constants.js",
		$srcPath . "/geometry.js",
			$srcPath . "/prefix.class.js",
			$srcPath . "/variables.js",
			$srcPath . "/functions.js",
			$srcPath . "/data.js",
			$srcPath . "/properties.js",
			$srcPath . "/events.js",
			$srcPath . "/shadows.js",
			$srcPath . "/render.js",
			$srcPath . "/public.js",
			$srcPath . "/suffix.class.js",
		$srcPath . "/suffix.js",
        $srcPath . "/engines/Leaflet.js"
	);
	for ($i = 0; $i < count($srcFiles) ; $i++) {
		echo "\n//*** ".$srcFiles[$i]." ***\n\n";
		echo file_get_contents($srcFiles[$i]);
		echo "\n";
	}
	?></script>
</head>

<body>
    <div id="map"></div>
    <script>
    var map = new L.Map('map').setView([52.50557421662625, 13.334510922431944], 17); // Berlin
//  var map = new L.Map('map').setView([55.82116684213355, 37.61263847351074], 17); // Moscow
    new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', { maxZoom: 17 }).addTo(map);
    var osmb = new L.BuildingsLayer({ url: '../server/?w={w}&n={n}&e={e}&s={s}&z={z}' }).addTo(map);
    osmb.setStyle({ shadows: 1 });
    </script>
</body>
</html>