<?php

require_once("config.php");
require_once("functions.php");
require_once("source/Abstract.php");

$coordsOrder = preg_match("/^lat/i", $coordsOrder) ? "lat,lon" : "lon,lat";

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

$Z = intval($_GET["z"]);
$z = $maxZoom - $Z;

$XY = geoToPixel($n, $w, $Z);

//*****************************************************************************

try {
    $source = Source_Abstract::create($dbConfig);
    $source->query(createBBox($n, $w, $s, $e));
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
	"schema" => array("HEIGHT", "MIN_HEIGHT", "FOOTPRINT", "COLOR", "ROOF_COLOR"),
    "data" => array(),
);

//*****************************************************************************

while ($row = $source->fetch()) {
    $height    = ($row->height    ? $row->height    : 5) * $heightScale >> $z;
    $minHeight = ($row->minHeight ? $row->minHeight : 0) * $heightScale >> $z;

    if ($height <= 1) continue;

    $f = strToPoly($row->footprint);
    $fp = array();
    for ($i = 0; $i < count($f)-1; $i+=2) {
        $px = geoToPixel($f[$i], $f[$i+1], $Z);
        $fp[$i]   = $px["x"] - $XY["x"] + $offsetX;
        $fp[$i+1] = $px["y"] - $XY["y"] + $offsetY;
    }

    // Make polygon winding clockwise. This is needed for proper backface culling on client side.
    // TODO: do this during data import
    $fp = makeClockwiseWinding($fp);

    $res = array($height, $minHeight, $fp);

    if ($row->color) {
        $res[] = $row->color;
    } else if ($row->roofColor) {
        $res[] = 0;
    }
    if ($row->roofColor) {
        $res[] = $row->roofColor;
    }

    $json["data"][] = $res;
}

if ($_GET["callback"]) {
    header("Content-Type: application/javascript; charset=utf-8");
    echo $_GET["callback"]."(".json_encode($json).");";
} else {
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($json);
}

?>