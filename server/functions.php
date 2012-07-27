<?php

function geoToPixel($lat, $lon, $zoomLevel) {
    global $tileSize;
    $mapSize = $tileSize << $zoomLevel;
    $latitude  = min(1, max(0, .5-( log( tan( M_PI/4 + M_PI/2 * $lat/180)) / M_PI) / 2) );
    $longitude = $lon/360 + .5;
	return array('x'=>intval($longitude*$mapSize), 'y'=>intval($latitude*$mapSize));
}

function strToPoly($str) {
    $res = explode(',', str_replace(' ', ',', preg_replace('/^[A-Z\(]+|\)+$/', '', $str)));
    for ($i = 0; $i < count($res); $i++) {
        $res[$i] *= 1;
    }
    return $res;
}

// creates the bounding box accoriding to expected lat/lon order
function createBBox($n, $w, $s, $e) {
    global $coordsOrder;
    if (preg_match('/^lat/i', $coordsOrder)) {
        return array($n, $w, $s, $e);
    }
    return array($w, $n, $e, $s);
}

function crop($n) {
    return round($n*100000)/100000;
}

// detect polygon winding direction: clockwise or counter clockwise
function getPolygonWinding($points) {
	$num = count($points);
	$maxN = $maxS = $points[0];
	$maxE = $maxW = $points[1];

	for ($i = 0; $i < $num-1; $i+=2) {
		if ($points[$i+1] < $maxW) {
			$maxW = $points[$i+1];
			$WI = $i;
		} else if ($points[$i+1] > $maxE) {
			$maxE = $points[$i+1];
			$EI = $i;
		}

		if ($points[$i] > $maxN) {
			$maxN = $points[$i];
			$NI = $i;
		}
	}

	$W = $WI-$NI;
	$E = $EI-$NI;

	if ($W < 0) $W += $num;
	if ($E < 0) $E += $num;

	return ($W > $E) ? 'CW' : 'CCW';
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
