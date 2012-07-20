<?php

function geoToPixel($lat, $lon, $zoomLevel) {
    global $tileSize;
    $mapSize = $tileSize << $zoomLevel;
    $latitude  = min(1, max(0, .5-( log( tan( M_PI/4 + M_PI/2 * $lat/180)) / M_PI) / 2) );
    $longitude = $lon/360 + .5;
	return array("x"=>intval($longitude*$mapSize), "y"=>intval($latitude*$mapSize));
}

function strToPoly($str) {
    $res = explode(",", str_replace(" ", ",", preg_replace('/^[A-Z\(]+|\)+$/', "", $str)));
    for ($i = 0; $i < count($res); $i++) {
        $res[$i] *= 1;
    }
    return $res;
}

function crop($n) {
    return round($n*100000)/100000;
}
