<?php

// create a file config.php and set up your MySQL parameters

require_once './config.php';
require_once './constants.php';
require_once './functions.php';

$db = mysql_connect($dbHost, $dbUser, $dbPass);
mysql_query("SET NAMES 'utf8'", $db);
mysql_select_db($dbName, $db);

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
    $n, $w,
	$n, $e,
	$s, $e,
	$s, $w,
    $n, $w
);

$Z = (int)$_GET['z'];
$z = MAX_ZOOM-$Z;

$XY = geoToPixel($n, $w, $Z);

//*****************************************************************************

$query = "
	SELECT
		height,
		ASTEXT(footprint) AS footprint
	FROM
		buildings
	WHERE
		MBRINTERSECTS(GEOMFROMTEXT('%s'), footprint)
    ORDER BY
        height
";

$args = array($boxPolygon);

$res = mysql_query(vsprintf($query, array_map("mysql_escape_string", $args)), $db);

if (mysql_error()) {
    header("HTTP/1.0 404 Not Found");
    exit;
}

if (!mysql_num_rows($res)) {
    header("HTTP/1.0 204 No Content");
    exit;
}

//*****************************************************************************

$json = array(
    "meta" => array(
        "n" => round($_GET["n"]*100000)/100000,
        "w" => round($_GET["w"]*100000)/100000,
        "s" => round($_GET["s"]*100000)/100000,
        "e" => round($_GET["e"]*100000)/100000,
        "x" => $XY["x"],
        "y" => $XY["y"],
        "z" => $Z
    ),
	"data" => array()
);

//*****************************************************************************

header("Content-Type: application/json; charset=utf-8");

while ($row = mysql_fetch_object($res)) {
    $h = ($row->height ? $row->height : 5)*SCALE_Z>>$z;

    if ($h <= 1) continue;

    $f = strToPoly($row->footprint);

    $fp = array();
    for ($i = 0; $i < count($f)-1; $i+=2) {
        $px = geoToPixel($f[$i], $f[$i+1], $Z);
        $fp[$i]   = $px["x"]-$XY["x"];
        $fp[$i+1] = $px["y"]-$XY["y"];
    }

    $json["data"][] = array($h, $fp);
}

echo json_encode($json);

