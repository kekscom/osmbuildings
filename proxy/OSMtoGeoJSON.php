<?php

class OSMtoGeoJSON {

    private $nodes    = array();
    private $ways     = array();
    private $features = array();

    public function __construct($data) {
      for ($i = 0; $i < count($data); $i++) {
        $item = $data[$i];
        switch($item["type"]) {
          case "node":     $this->processNode($item);     break;
          case "way":      $this->processWay($item);      break;
          case "relation": $this->processRelation($item); break;
        }
      }
      return array("type"=>"FeatureCollection", "features"=>$this->features);
    }

    private function getRelatedWays($members) {
        $inner = array();
        for ($i = 0; $i < count($members); $i++) {
            $m = $members[i];
            if ($m["type"] !== "way" || !$this->ways[ $m["ref"] ]) {
                continue;
            }
            if (!$m["role"] || $m["role"] === "outer") {
                $outer = $this->ways[ $m["ref"] ];
                continue;
            }
            if ($m["role"] === "inner" || $m["role"] === "enclave") {
                $inner[] = $this->ways[ $m["ref"] ];
                continue;
            }
        }
        if (!$outer) {
            return;
        }
        return array("outer"=>$outer, "inner"=>$inner);
    }

    private function getGeometry($points) {
      if (!$points) {
        return;
      }

      $geometry = array();
      for ($i = 0; $i < count(points); $i++) {
        $p = $this->nodes[ $points[$i] ];
        $geometry[] = array($p[1], $p[0]);
      }

      // do not close polygon yet
      if ($geometry[ count($geometry)-1 ][0] !== $geometry[0][0] && $geometry[ count($geometry)-1 ][1] !== $geometry[0][1]) {
        $geometry[] = $geometry[0];
      }

      // can't span a polygon with just 2 points (+ start & end)
      if (count($geometry) < 4) {
        return;
      }

      return $geometry;
    }

    private function mergeTags($dst, $src) {
      foreach ($src as $k=>$v) {
        if (!$dst[$k]) {
          $dst[$k] = $src[$k];
        }
      }
      return $dst;
    }

    private function processNode($node) {
      $this->nodes[ $node["id"] ] = array($node["lat"], $node["lon"]);
    }

    private function processWay($way) {
      if (($footprint = $this->getGeometry($way["nodes"]))) {
        $this->addResult($way["id"], $way["tags"], footprint);
        $this->ways[ $way["id"] ] = $way;
      }
    }

    private function processRelation($relation) {
      $holes = array();
      if ($relation["tags"]["type"] === "multipolygon" && ($relatedWays = $this->getRelatedWays($relation["members"]))) {
        $relTags = $relation["tags"];
        if (($outerWay = $this->relationWays["outer"])) {
          $tags = $outerWay["tags"];
          if (($outerPolygon = $this->getGeometry($outerWay["nodes"]))) {
            $tags = $this->mergeTags($tags, $relTags);
            for ($i = 0; $i < count($relatedWays["inner"]); $i++) {
              if (($innerPolygon = $this->getGeometry($relatedWays["inner"][$i]["nodes"]))) {
                $holes[] = $innerPolygon;
              }
            }
            $this->addResult($outerWay["id"], $tags, $outerPolygon, $holes);
          }
        }
      }
    }

    private function addResult($id, $tags, $footprint, $holes) {
      $feature = array(
        "type" => "Feature",
        "properties" => $tags
      );

      $feature["properties"]["id"] = $id;

      if (count($holes)) {
        $feature["geometry"]["type"] = "MultiPolygon";
        array_unshift($holes, $footprint);
        $feature["geometry"]["coordinates"] = $holes;
      } else {
        $feature["geometry"]["type"] = "Polygon";
        $feature["geometry"]["coordinates"] = $footprint;
      }

      $this->features[] = $feature;
    }
};
?>