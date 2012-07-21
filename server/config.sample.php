<?php

$offsetX     = 0;   // adjust x pixel values
$offsetY     = 0;   // adjust y pixel values
$heightScale = 3;   // scale building height by this factor
$tileSize    = 256; // tile size, usually 256
$maxZoom     = 18;  // max. zoom level in your tile set

// set your (MySQL) parameters and rename this file to config.php

$dbConfig = array(
    'host' => 'localhost',
    'user' => '',
    'password' => '',
    'dbname' => '',
    'table' => '',
    'coords' => 'lat,lon' // the order of coordinates in your db
);
