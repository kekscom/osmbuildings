<?php
if (!function_exists("curl_init")) {
    die("CURL is not available");
}

$url = "http://ows1.geocontent.de/owsProxy/?" . $_SERVER["QUERY_STRING"];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
curl_setopt($ch, CURLOPT_HEADER, FALSE);
curl_setopt($ch, CURLOPT_ENCODING, "");

$contents = curl_exec($ch);
curl_close($ch);

header("Content-Type: image/jpeg");
echo $contents;
?>