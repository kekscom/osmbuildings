<?php

$offsetX     = 0;   // adjust x pixel values
$offsetY     = 0;   // adjust y pixel values
$heightScale = 1.2;   // scale building height by this factor
$tileSize    = 256; // tile size, usually 256
$maxZoom     = 18;  // max. zoom level in your tile set
$coordsOrder = "lat,lon"; // the order of coordinates in your data

// set your database parameters and rename this file to config.php

$dbConfig = array(
    "source"   => "Mysql", // valid are: "Mysql", "Mapnik", "CartoDB"
    "host"     => "localhost",
    "user"     => "",
    "password" => "",
    "dbname"   => "",
    "table"    => "buildings"
);

$dbConfig = array(
    "source"         => "CartoDB",
    "user"           => "osmbuildings", // your account name
    "table"          => "map_polygon",
    "fieldHeight"    => "", // height info, highly recommended
    "fieldMinHeight" => "", // optional
    "fieldColor"     => "", // optional
    "fieldRoofColor" => "", // optional
    "fieldFootprint" => "the_geom", // required
    "extraCondition" => "" // optional, i.e. filter for buildings: building IS NOT NULL
);
$coordsOrder = "lon,lat";

?>