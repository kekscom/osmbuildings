<?php

$coordsOrder = 'lat,lon'; // the order of coordinates in your data

// set your database parameters and rename this file to config.php

$dbConfig = array(
    "source"   => "Mysql", // valid are: "Mysql", "Mapnik", "CartoDB"
    "host"     => "localhost",
    "user"     => "",
    "password" => "",
    "dbname"   => "",
    "table"    => "buildings"
);



/**
 * this is a CartoDB specific example:
 * all it does is defining column names in order to create the correct sql query
 * which is then sent as url to CartoDB
 */

// this just overwrites $dbConfig above
$dbConfig = array(
    "source"         => "CartoDB",
    "user"           => "osmbuildings", // your account name, required
    "table"          => "map_polygon", // required
    "columnHeight"    => "", // height info, highly recommended
    "columnMinHeight" => "", // optional
    "columnColor"     => "", // optional
    "columnRoofColor" => "", // optional
    "columnFootprint" => "the_geom", // required
    "extraCondition" => "" // optional, i.e. filter for buildings: "building IS NOT NULL"
);

// this just overwrites $coordsOrder above (CartoDB requires lon,lat order)
$coordsOrder = "lon,lat";

?>
