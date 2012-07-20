<?php

require_once './config.php';
require_once './functions.php';

//*****************************************************************************

if (!isset($_GET["n"]) || !isset($_GET["w"]) || !isset($_GET["s"]) || !isset($_GET["e"])) {
    header("HTTP/1.0 400 Bad Request");
    echo "Bounding box missing.";
	exit;
}

if (!isset($_GET["z"])) {
    header("HTTP/1.0 400 Bad Request");
    echo "Zoom level missing.";
    exit;
}

$n = $_GET["n"];
$w = $_GET["w"];
$s = $_GET["s"];
$e = $_GET["e"];

$Z = (int)$_GET['z'];
$z = $maxZoom-$Z;

$XY = geoToPixel($n, $w, $Z);

//*****************************************************************************

require './source/Mysql.php';
try {
    $source = new Source_Mysql($dbConfig);
    $source->setBbox($n, $w, $s, $e)->query();
} catch(Exception $e) {
    header("HTTP/1.0 404 Not Found");
    exit;
}

if (!$source->count()) {
    header("HTTP/1.0 204 No Content");
    exit;
}

//*****************************************************************************

$json = array(
    "meta" => array(
        "n" => crop($_GET["n"]),
        "w" => crop($_GET["w"]),
        "s" => crop($_GET["s"]),
        "e" => crop($_GET["e"]),
        "x" => $XY["x"],
        "y" => $XY["y"],
        "z" => $Z
    ),
    'data' => array(),
);

//*****************************************************************************

header('Content-Type: application/json; charset=utf-8');

while ($row = $source->fetch()) {
    $h = ($row->height ? $row->height : 5)*$heightScale >> $z;

    if ($h <= 1) {
        continue;
    }

    $f = strToPoly($row->footprint);

    $fp = array();
    for ($i = 0; $i < count($f)-1; $i+=2) {
        // TODO: find a nicer way
        if (preg_match('/^lat/i', $this->_options['coords'])) {
            $px = geoToPixel($f[$i], $f[$i+1], $Z);
        } else {
            $px = geoToPixel($f[$i+1], $f[$i], $Z);
        }
        $fp[$i]   = $px["x"] - $XY["x"] + $offsetX;
        $fp[$i+1] = $px["y"] - $XY["y"] + $offsetY;
    }

    $json["data"][] = array($h, $fp);
}

echo json_encode($json);
