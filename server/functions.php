<?php

function geoToPixel($lat, $lon, $zoomLevel) {
    global $tileSize;
    $mapSize = $tileSize << $zoomLevel;
    $latitude  = min(1, max(0, .5-( log( tan( M_PI/4 + M_PI/2 * $lat/180)) / M_PI) / 2) );
    $longitude = $lon/360 + .5;
    return array('x'=>intval($longitude*$mapSize), 'y'=>intval($latitude*$mapSize));
}

// parse from geometry text, swap llon/lat order
function strToPoly($str) {
    global $coordsOrder;
    $coords = explode(',', str_replace(' ', ',', preg_replace('/^[A-Z\(]+|\)+$/', '', $str)));
    $res = array();

    for ($i = 0; $i < count($coords)-1; $i+=2) {
        if ($coordsOrder === 'lat,lon') {
            $res[$i  ] = $coords[$i  ]*1;
            $res[$i+1] = $coords[$i+1]*1;
        } else {
            $res[$i  ] = $coords[$i+1]*1;
            $res[$i+1] = $coords[$i  ]*1;
        }
    }

    return $res;
}

// creates the bounding box accoriding to expected lat/lon order
function createBBox($n, $w, $s, $e) {
    global $coordsOrder;
    if ($coordsOrder === 'lat,lon') {
        return array($n, $w, $s, $e);
    }
    return array($w, $n, $e, $s);
}

function crop($n) {
    return round($n*100000)/100000;
}

// detect polygon winding direction: clockwise or counter clockwise
function getPolygonWinding($points) {
    $a = 0;
    for ($i = 0; $i < count($points); $i += 2) {
        $x1 = $points[$i  ];
        $y1 = $points[$i+1];
        $x2 = $points[$i+2];
        $y2 = $points[$i+3];
        $a += $x1 * $y2 - $x2 * $y1;
    }
    return ($a / 2) > 0 ? 'CW' : 'CCW';
}

// Make polygon winding clockwise. This is needed for proper backface culling on client side.
function makeClockwiseWinding($points) {
    $winding = getPolygonWinding($points);
    if ($winding == 'CW') {
        return $points;
    }
    $revPoints = array();
    for ($i = count($points)-2; $i >= 0; $i-=2) {
        $revPoints[] = $points[$i];
        $revPoints[] = $points[$i+1];
    }
    return $revPoints;
}
