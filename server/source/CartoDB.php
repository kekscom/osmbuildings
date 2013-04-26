<?php

if (!function_exists("curl_init")) {
    die("CURL is not available");
}

require_once(dirname(__FILE__)."/Abstract.php");

class Source_CartoDB extends Source_Abstract {

    private $resultPos = 0;

    public function init() {
        $this->url = "http://" . $this->_options["user"] . ".cartodb.com/api/v2/sql?q=";

        $tags = array(
            "{table}"          => $this->_options["table"],
            "{fieldHeight}"    => $this->_options["fieldHeight"]    ? $this->_options["fieldHeight"]    : 10,
            "{fieldMinHeight}" => $this->_options["fieldMinHeight"] ? $this->_options["fieldMinHeight"] : 0,
            "{fieldColor}"     => $this->_options["fieldColor"]     ? $this->_options["fieldColor"]     : "NULL",
            "{fieldRoofColor}" => $this->_options["fieldRoofColor"] ? $this->_options["fieldRoofColor"] : "NULL",
            "{fieldFootprint}" => $this->_options["fieldFootprint"],
            "{extraCondition}" => $this->_options["extraCondition"] ? " AND " . $this->_options["fieldMinHeight"] : "",
            "{orderBY}"        => $this->_options["fieldHeight"]    ? " ORDER BY " . $this->_options["fieldHeight"] . " DESC " : ""
        );

        $query = "
            SELECT
                {fieldHeight} AS height,
                {fieldMinHeight} AS minHeight,
                {fieldColor} AS color,
                {fieldRoofColor} AS roofColor,
                ST_AsText(ST_ExteriorRing(ST_GeometryN(the_geom,1))) AS footprint
            FROM
                {table}
            WHERE
                {fieldFootprint} && ST_SetSRID(%s, 4326)
                {extraCondition}
            {orderBY}
        ";
        $this->queryStr = strtr(trim(preg_replace("/[\t\r\n ]+/", " ", $query)), $tags);
    }

    private function getHTTP($url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
        $res = curl_exec($ch);
        curl_close($ch);
        if ($res) {
            return json_decode($res, TRUE);
        }
    }

    public function query($bbox) {
        $bbox = array(53.00,13.00,52.00,14.00);
        $bboxStr = vsprintf("ST_MakeBox2D(ST_Point(%2$.5f, %3$.5f), ST_Point(%4$.5f, %1$.5f))", $bbox);

        $url = $this->url . urlencode(vsprintf($this->queryStr, array($bboxStr)));

        $this->result = $this->getHTTP($url);
        $this->resultPos = 0;

        if (!$this->result) {
            throw new Exception("no results");
        }
        if ($this->result["error"]) {
            throw new Exception($this->result["error"]);
        }

        return $this;
    }

    public function count() {
        return $this->result["total_rows"];
    }

    public function fetch() {
        if ($this->resultPos == $this->result["total_rows"]) {
            return;
        }
        $row = (object)$this->result["rows"][$this->resultPos];
        $this->resultPos++;
        return $row;
    }
}

?>