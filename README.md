# OSM Buildings

A JavaScript library for visualizing 3D OSM building data on interactive maps

## Important

The whole library consists of client JavaScript files, a server side PHP script and a MySQL database.
Everything should be handled as alpha state. All components are likely to change extensively.

Bottleneck is data availability. I can't process and host a whole OSM planet file.
Actually I'm looking for a partner to provide a data service to you.


## Prerequisites

1. You will need MySQL as data storage. Version 5.0.16 or better has the required <a href="http://dev.mysql.com/doc/refman/5.0/en/spatial-extensions.html">Spatial Extensions</a> enabled.
Everything can be done in different Geo enabled databases too. For now we just go MySQL.
 
2. You will need to import OSM building data from /server/buildings.sql.zip. Either upload this directly in PhpMyAdmin or unpack and import as you like.

3. Make sure PHP is running and create a /server/config.php file for your MySQL credentials. Or just adapt and rename /server/config.sample.php for your needs.


## Integration

I assume, Leaflet is already integrated in your html page. If not, head over to its <a href="http://leaflet.cloudmade.com/reference.html">documentation</a>.

Then in header section, add:

```html
<head>
    :
    :
  <script src="dist/buildings.js"></script>
</head>
```

after Leaflet initialization add:
	  
```javascript
var map = new L.Map('map');
  :
  :
// you may stay with any maptiles you are already using. these are just my favourites.
// remember to obtain an API key from <a href="http://mapbox.com">MapBox</a>.
// please keep the attribution part for proper copyright notice.
var mapboxTiles = new L.TileLayer(
	"http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png",
	{
		attribution: 'Buildings engine &copy; <a href="http://flyjs.com">FlyJS</a> &bull; Map data &copy; 2012 <a href="http://openstreetmap.org">OpenStreetMap</a> contributors <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA  2.0</a> &bull; Map tiles &copy; <a href="http://mapbox.com">MapBox</a>',
		maxZoom: 17
	}
);

// there is just data for Berlin, Germany at the moment, lets start there
map.setView(new L.LatLng(52.52111, 13.40988), 17).addLayer(mapboxTiles);

// this applies the functionality to Leaflet
Buildings.setMap("leaflet", map);

// this finally starts loading data from your PHP/MySQL combo
// you will need to have this on the same server, otherwise there are cross origin issues
Buildings.load("server/?w={w}&n={n}&e={e}&s={s}&z={z}", {
	strokeRoofs: false,
	wallColor: "rgb(190,170,150)",
	roofColor: "rgb(230,220,210)",
	strokeColor: "rgb(145,140,135)"
});
```

done.

For any further information visit <a href="http://flyjs.com/buildings">http://flyjs.com/buildings</a>, follow <a href="https://twitter.com/osmbuildings">@osmbuildings</a> on Twitter or report issues here on Github.