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
            "{table}"           => $this->_options["table"],
            "{columnHeight}"    => $this->_options["columnHeight"]    ? $this->_options["columnHeight"]    : 10,
            "{columnMinHeight}" => $this->_options["columnMinHeight"] ? $this->_options["columnMinHeight"] : 0,
            "{columnColor}"     => $this->_options["columnColor"]     ? $this->_options["columnColor"]     : "NULL",
            "{columnRoofColor}" => $this->_options["columnRoofColor"] ? $this->_options["columnRoofColor"] : "NULL",
            "{columnFootprint}" => $this->_options["columnFootprint"],
            "{extraCondition}"  => $this->_options["extraCondition"]  ? " AND " . $this->_options["extraCondition"] : "",
            "{orderBY}"         => $this->_options["columnHeight"]    ? " ORDER BY " . $this->_options["columnHeight"] . " DESC " : ""
        );

        $query = "
            SELECT
                {columnHeight} AS height,
                {columnMinHeight} AS minHeight,
                {columnColor} AS color,
                {columnRoofColor} AS roofColor,
                ST_AsText(ST_ExteriorRing(ST_GeometryN(the_geom,1))) AS footprint
            FROM
                {table}
            WHERE
                {columnFootprint} && ST_SetSRID(%s, 4326)
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
        $bboxStr = vsprintf("ST_MakeBox2D(ST_Point(%1$.5f, %4$.5f), ST_Point(%3$.5f, %2$.5f))", $bbox);

        $url = $this->url . urlencode(vsprintf($this->queryStr, array($bboxStr)));

        $this->result = $this->getHTTP($url);
        $this->resultPos = 0;

        if (!$this->result) {
            throw new Exception("no results");
        }

        if ($this->result["error"]) {
            throw new Exception($this->result["error"][0]);
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