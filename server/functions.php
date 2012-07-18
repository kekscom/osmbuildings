<?php
function geoToPixel($lat, $lon, $zoomLevel) {
    $mapSize = TILE_SIZE << $zoomLevel;
    $latitude  = min(1, max(0, .5-( log( tan( M_PI/4 + M_PI/2 * $lat/180)) / M_PI) / 2) );
    $longitude = $lon/360 + .5;
	return array("x"=>intval($longitude*$mapSize), "y"=>intval($latitude*$mapSize));
}

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

function strToPoly($str) {
    $res = explode(",", str_replace(" ", ",", preg_replace('/^[A-Z\(]+|\)+$/', "", $str)));
    for ($i = 0; $i < count($res); $i++) {
        $res[$i] *= 1;
    }
    return $res;
}

