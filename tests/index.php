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
    <script src="leaflet-0.5.1/leaflet.js"></script>
	<script><?php
	$srcPath = "../src";
	$srcFiles = array(
		$srcPath . "/prefix.js",
		$srcPath . "/shortcuts.js",
		$srcPath . "/lib/Color.js",
        $srcPath . "/lib/SunPosition.js",
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

    <style>
    .datetime {
        position: relative;
        bottom: 140px;
        width: 300px;
        margin: auto;
        background-color: rgba(255,255,255,0.4);
        font-size: 10pt;
        font-family: Helvetica, Arial, sans-serif;
        padding: 10px;
    }
    .datetime label {
        display: block;
        width: 100%;
        height: 20px;
    }
    .datetime input {
        width: 100%;
        height: 30px;
        margin-bottom: 10px;
        background-color: transparent;
    }
    </style>

    <div class="datetime">
        <label for="time">Time: </label>
        <input id="time" type="range" min="0" max="95">

        <label for="date">Date: </label>
        <input id="date" type="range" min="0" max="23">
    </div>

    <script>
    var map = new L.Map('map').setView([52.50557421662625, 13.334510922431944], 17); // Berlin
//  var map = new L.Map('map').setView([55.82116684213355, 37.61263847351074], 17); // Moscow
    new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', { maxZoom: 17 }).addTo(map);
    var osmb = new L.BuildingsLayer({ url: '../server/?w={w}&n={n}&e={e}&s={s}&z={z}' }).addTo(map);
    </script>

    <script>
    var timeRange = document.querySelector('#time');
    var timeRangeLabel = document.querySelector('*[for=time]');

    var dateRange = document.querySelector('#date');
    var dateRangeLabel = document.querySelector('*[for=date]');

    // var date = new Date();
    var date = new Date(2013, 2, 15, 10, 30);

    var timeScale = 4,
		dateScale = 2,
		Y = date.getFullYear(),
        M = date.getMonth(),
        D = date.getDate() < 15 ? 1 : 15,
        h = date.getHours(),
        m = date.getMinutes() % 4 * 15;

	timeRange.value = h * timeScale;
    dateRange.value = M * dateScale;
    changeDate();

    function pad(v) {
        return (v < 10 ? '0' : '') + v;
    }

    function changeDate() {
        timeRangeLabel.innerText = 'Time: ' + pad(h) + ':' + pad(m);
        dateRangeLabel.innerText = 'Date: ' + Y + '-' + pad(M+1) + '-' + pad(D);
        osmb.setDate(new Date(Y, M, D, h, m));
    }

    timeRange.addEventListener('change', function () {
        h = this.value / timeScale <<0;
        m = this.value % timeScale * 15;
        changeDate();
    }, false);

    dateRange.addEventListener('change', function () {
        M = this.value / dateScale <<0;
        D = this.value % dateScale ? 15 : 1;
        changeDate();
    }, false);
    </script>
</body>
</html>