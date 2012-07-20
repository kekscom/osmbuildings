<?php

require './config.php';
require './functions.php';

$db = pg_connect("host=$dbHost port=5432 dbname=$dbName user=$dbUser password=$dbPass");

//*****************************************************************************

// deprecated after move to Source Postgres
function polyToStr() {
    $points = func_get_args();
    if (count($points) % 2 != 0) {
        array_pop($points);
    }
    $res = array();
    for ($i = 0; $i < count($points)-1; $i+=2) {
        $res[] = $points[$i]." ".$points[$i+1];
    }
    return "POLYGON((".implode(",", $res)."))";
}

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

$boxPolygon = polyToStr(
    $w, $n,
	$e, $n,
	$e, $s,
	$w, $s,
    $w, $n
);

$Z = (int)$_GET['z'];
$z = $maxZoom-$Z;

$XY = geoToPixel($n, $w, $Z);

//*****************************************************************************

$query = "
    SELECT
        COALESCE(height, \"building:height\") AS height,
        COALESCE(levels, \"building:levels\", \"building:levels:aboveground\") AS levels,
        ST_AsText(ST_ExteriorRing(the_geom)) AS footprint
    FROM
        {$dbTable}
 	WHERE
		NOT ST_IsEmpty(ST_Intersection(ST_GeomFromText('%s', 4326), the_geom))
    ORDER BY
        height DESC, levels DESC
";

$args = array($boxPolygon);

$res = pg_query($db, vsprintf($query, array_map("pg_escape_string", $args)));

if (pg_last_error()) {
    header("HTTP/1.0 404 Not Found");
    exit;
}

if (!pg_num_rows($res)) {
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
	"data" => array()
);

//*****************************************************************************

header("Content-Type: application/json; charset=utf-8");

while ($row = pg_fetch_object($res)) {
    $h = ($row->height ? $row->height : ($row->levels ? $row->levels*3.5 : 5))*$heightScale >> $z;

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
