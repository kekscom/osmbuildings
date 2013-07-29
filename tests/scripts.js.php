<?php

$srcPath = "../src";
$srcFiles = array(
    $srcPath . "/prefix.js",
    $srcPath . "/shortcuts.js",
    $srcPath . "/lib/Color.js",
    $srcPath . "/lib/SunPosition.js",
    $srcPath . "/Import.js",
    $srcPath . "/import/GeoJSON.js",
    $srcPath . "/import/OSMXAPI.js",
    $srcPath . "/constants.js",
    $srcPath . "/geometry.js",
    $srcPath . "/variables.js",
    $srcPath . "/functions.js",
    $srcPath . "/Cache.js",
    $srcPath . "/Data.js",
    $srcPath . "/render.js",
    $srcPath . "/Shadows.js",
    $srcPath . "/FlatBuildings.js",
    $srcPath . "/Layers.js",
    $srcPath . "/properties.js",
    $srcPath . "/events.js",
    $srcPath . "/engines/".$_GET["engine"].".js",
    $srcPath . "/suffix.js"
);


header("Content-Type: application/javascript");
for ($i = 0; $i < count($srcFiles) ; $i++) {
    echo "\n//*** ".$srcFiles[$i]." ***\n\n";
    echo file_get_contents($srcFiles[$i]);
    echo "\n";
}

?>