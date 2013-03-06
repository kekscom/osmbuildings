<!DOCTYPE html>
<html>
<head>
    <title>OSM Buildings - OpenLayers</title>
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
	<style>
	body {
		margin: 0;
		padding: 0;
		font-family: Arial, Helvetica, sans-serif;
	}
	#map {
		width: 700px;
		height: 400px;
		margin: 0 auto !important;
		border: 1px solid #ccc;
	}
	</style>
    <script src="http://www.openlayers.org/api/OpenLayers.js"></script>
    <script src="../dist/OpenLayers.Layer.Buildings.js"></script>

<body>
    <div id="map"></div>

    <script>
    var map = new OpenLayers.Map('map');
    map.addControl(new OpenLayers.Control.LayerSwitcher());

    var osm = new OpenLayers.Layer.OSM();
    map.addLayer(osm);

    map.setCenter(
        new OpenLayers.LonLat(13.33522, 52.50440)
            .transform(
                new OpenLayers.Projection('EPSG:4326'),
                map.getProjectionObject()
            ),
        17
    );
    var osmb = new OpenLayers.Layer.Buildings({ url: '../server/?w={w}&n={n}&e={e}&s={s}&z={z}' });
    map.addLayer(osmb);
    </script>
</body>
</html>


