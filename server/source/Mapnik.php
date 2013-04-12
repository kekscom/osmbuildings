<?php

require_once(dirname(__FILE__)."/Abstract.php");

class Source_Mapnik extends Source_Abstract {

    public function init() {
        extract($this->_options);
        if (!isset($port)) { // default port
            $port = 5432;
        }
        $this->_link = pg_connect("host={$host} port={$port} user={$user} password={$password} dbname={$dbname} connect_timeout=3");
        if (!$this->_link) {
            throw new Exception(pg_last_error());
        }
    }

    public function query($bbox) {
        $query = "
            SELECT
                height,
                min_height AS minHeight,
                color,
                roof_color AS roofColor,
                ST_AsText(ST_Transform(ST_ExteriorRing(way), 4326)) AS footprint
            FROM
                {$this->_options['table']}
            WHERE
                way && ST_Transform(SetSRID('BOX3D(%s)'::box3d, 4326), 900913)
                AND building IS NOT NULL
            ORDER BY
                height DESC
        ";

        // alternative WHERE: ST_Intersects(ST_GeomFromText('%s', 4326), geom)

        $bboxStr = vsprintf("%1$.5f %2$.5f, %3$.5f %4$.5f", $bbox);
        $query = vsprintf($query, array_map("pg_escape_string", array($bboxStr)));

        $this->_collection = pg_query($this->_link, $query);
        if (!$this->_collection) {
            throw new Exception(pg_last_error());
        }
        return $this;
    }

    public function count() {
        if($this->_collection){
            return pg_num_rows($this->_collection);
        }
        return null;
    }

    public function fetch() {
        return pg_fetch_object($this->_collection);
    }
}

?>