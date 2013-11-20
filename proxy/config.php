<?php

define("DEBUG", TRUE);

$config = array(
  "rest" => array(
    "origin" => "*",
    "age" => 60*60*8
  ),
  "cache" => array(
    "path" => "cache",
    "size" => 1024*1024*1024 // 1GB
  )
);

?>