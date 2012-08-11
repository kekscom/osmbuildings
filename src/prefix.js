/*jshint bitwise:false */

/** @namespace OSMBuildings */

/**
 * @fileOverview OSM Buildings
 *
 * @author Jan Marsch (@kekscom)
 * @version 0.1a
 * @example
var map = new L.Map('map');

var buildings = new OSMBuildings(
    'server/?w={w}&n={n}&e={e}&s={s}&z={z}',
    {
        strokeRoofs: false,
        wallColor: 'rgb(190,170,150)',
        roofColor: 'rgb(230,220,210)',
        strokeColor: 'rgb(145,140,135)'
    }
);

buildings.addTo(map);
*/

/**
 * @example
var map = new L.Map('map');
new OSMBuildings('server/?w={w}&n={n}&e={e}&s={s}&z={z}').addTo(map);
*/

(function (global) {

    'use strict';

    global.Int32Array = global.Int32Array || global.Array;
