<?php

$offsetX     = 0;   // adjust x pixel values
$offsetY     = 0;   // adjust y pixel values
$heightScale = 3;   // scale building height by this factor
$tileSize    = 256; // tile size, usually 256
$maxZoom     = 18;  // max. zoom level in your tile set
$coordsOrder = 'lat,lon'; // the order of coordinates in your data

// set your database parameters and rename this file to config.php

$dbConfig = array(
    'source' => 'Mysql', // valid are: Mysql, Mapnik
    'host' => 'localhost',
    'user' => '',
    'password' => '',
    'dbname' => '',
    'table' => 'buildings'
);
