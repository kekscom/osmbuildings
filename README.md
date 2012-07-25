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
Important: version 0.4 of Leaflet.js is required.

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
// You may stay with any maptiles you are already using. these are just my favourites.
// Remember to obtain an API key from <a href="http://mapbox.com">MapBox</a>.
// And keep the attribution part for proper copyright notice.
var mapboxTiles = new L.TileLayer(
	'http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png',
	{
		attribution: 'Map tiles &copy; <a href="http://mapbox.com">MapBox</a>',
		maxZoom: 17
	}
);

// there is just data for Berlin, Germany at the moment, lets start there
map.setView(new L.LatLng(52.52111, 13.40988), 17).addLayer(mapboxTiles);


// This finally creates the buildings layer.
// As soon as you attach it to the map it starts loading data from your PHP/MySQL combo.
// You will need to have this on the same server, otherwise there are cross origin issues.
var buildings = new OSMBuildings(
	'server/?w={w}&n={n}&e={e}&s={s}&z={z}',
	{
		strokeRoofs: false,
		wallColor: 'rgb(190,170,150)',
		roofColor: 'rgb(230,220,210)',
		strokeColor: 'rgb(145,140,135)'
	}
);
buildings.addTo(map);

// Like to save code? This one liner basically does the same thing as above.
new OSMBuildings('server/?w={w}&n={n}&e={e}&s={s}&z={z}').addTo(map);
```

done.

For any further information visit <a href="http://osmbuildings.org">http://osmbuildings.org</a>, follow <a href="https://twitter.com/osmbuildings">@osmbuildings</a> on Twitter or report issues here on Github.