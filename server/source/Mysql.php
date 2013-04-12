<?php

require_once(dirname(__FILE__)."/Abstract.php");

class Source_Mysql extends Source_Abstract {

    public function init() {
        $this->_link = new mysqli($this->_options["host"], $this->_options["user"], $this->_options["password"], $this->_options["dbname"]);
        if ($this->_link->connect_errno) {
            throw new Exception($this->_link->connect_error);
        }
        $this->_link->query("SET NAMES 'utf8'");
    }

    public function query($bbox) {
        $query = "
            SELECT
                height,
                min_height AS minHeight,
                color,
                roof_color AS roofColor,
                ASTEXT(footprint) AS footprint
            FROM
                {$this->_options['table']}
            WHERE
                deleted IS NULL AND
                MBRINTERSECTS(GEOMFROMTEXT('%s'), footprint)
            ORDER BY
                height
        ";

        $bboxStr = vsprintf("POLYGON((%1$.5f %2$.5f, %1$.5f %4$.5f, %3$.5f %4$.5f, %3$.5f %2$.5f, %1$.5f %2$.5f))", $bbox);
        $query = vsprintf($query, array_map("mysql_escape_string", array($bboxStr)));

        $this->_collection = $this->_link->query($query);
        if ($this->_link->errno) {
            throw new Exception($this->_link->error);
        }
        return $this;
    }

    public function count() {
        if ($this->_collection) {
            return $this->_collection->num_rows;
        }
        return NULL;
    }

    public function fetch() {
        return $this->_collection->fetch_object();
    }
}

?>