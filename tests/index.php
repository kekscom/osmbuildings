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
	<script src="scripts.js.php"></script>
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
    var map = new L.Map('map').setView([52.50557, 13.33451], 17); // Berlin Ku'Damm
//  var map = new L.Map('map').setView([52.52079, 13.40882], 17); // Berlin Fernsehturm
//  var map = new L.Map('map').setView([55.82116, 37.61263], 17); // Moscow
    new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', { maxZoom: 18 }).addTo(map);
//  new L.TileLayer('http://{s}.tiles.mapbox.com/v3/osmbuildings.map-c8zdox7m/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    var osmb = new L.BuildingsLayer({ url: '../server/?w={w}&n={n}&e={e}&s={s}&z={z}' }).addTo(map);
    L.control.layers({}, { Buildings: osmb }).addTo(map);
    </script>

    <script>
    var timeRange = document.querySelector('#time');
    var timeRangeLabel = document.querySelector('*[for=time]');

    var dateRange = document.querySelector('#date');
    var dateRangeLabel = document.querySelector('*[for=date]');

    // var date = new Date();
    var date = new Date(2013, 4, 15, 11, 0);

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