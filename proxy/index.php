<?php

$root = ".";
require_once("$root/config.php");

error_reporting(DEBUG ? E_ERROR : E_NONE);
session_start();

require_once("Cache.php");
require_once("REST.php");

$Cache = new Cache($config["cache"]);
$REST  = new REST($config["rest"], $Cache);

//switch ($REST->resource) {
//$REST->sendResponse($service->process($REST->params, $REST->filter));
//$REST->sendStatus(422);
?>