<?php

class FilterGeoJSON {

  private $METERS_PER_LEVEL = 3;

  private $materialColors = array(
    "brick"=>"#cc7755",
    "bronze"=>"#ffeecc",
    "canvas"=>"#fff8f0",
    "concrete"=>"#999999",
    "copper"=>"#a0e0d0",
    "glass"=>"#e8f8f8",
    "gold"=>"#ffcc00",
    "plants"=>"#009933",
    "metal"=>"#aaaaaa",
    "panel"=>"#fff8f0",
    "plaster"=>"#999999",
    "roof_tiles"=>"#f08060",
    "silver"=>"#cccccc",
    "slate"=>"#666666",
    "stone"=>"#996666",
    "tar_paper"=>"#333333",
    "wood"=>"#deb887"
  );

  private $baseMaterials = array(
    "asphalt"=>"tar_paper",
    "bitumen"=>"tar_paper",
    "block"=>"stone",
    "bricks"=>"brick",
    "glas"=>"glass",
    "glassfront"=>"glass",
    "grass"=>"plants",
    "masonry"=>"stone",
    "granite"=>"stone",
    "panels"=>"panel",
    "paving_stones"=>"stone",
    "plastered"=>"plaster",
    "rooftiles"=>"roof_tiles",
    "roofingfelt"=>"tar_paper",
    "sandstone"=>"stone",
    "sheet"=>"canvas",
    "sheets"=>"canvas",
    "shingle"=>"tar_paper",
    "shingles"=>"tar_paper",
    "slates"=>"slate",
    "steel"=>"metal",
    "tar"=>"tar_paper",
    "tent"=>"canvas",
    "thatch"=>"plants",
    "tile"=>"roof_tiles",
    "tiles"=>"roof_tiles"
  );

  public function __construct($features) {
    $collection = array();
    for ($i = 0; $i < count($features); $i++) {
      if ($this->isBuilding($features[$i])) {
        $collection[] = array(
            "type"       => "Feature",
            "properties" => $this->filterProperties($features[$i]["properties"]),
            "geometry"   => $features[$i]["geometry"]
        );
      }
    }
    return array("type"=>"FeatureCollection", "features"=>$collection, "properties"=>array("filter"=>"buildings"));
  }

  private function isBuilding($feature) {
    $properties = $feature["properties"];
    return ($properties && !$properties["landuse"] && ($properties["building"] || $properties["building:part"]) && (!$properties["layer"] || $properties["layer"] >= 0));
  }

//  living:"bricks",
//  nonliving:"tar_paper",
//  worship:"copper"

  private function getMaterialColor($str) {
    $str = strtolower($str);
    if (substr($str, 0, 1) == '#') {
        return $str;
    }
    $material = $this->baseMaterials[$str] ? $this->baseMaterials[$str] : $str;
    return $this->materialColors[$material];
  }

  private function getBuildingType($properties) {
    if ($properties["amenity"] === "place_of_worship") {
      return "worship";
    }
    $type = $properties["building"];
    if ($type === "yes" || $type === "roof") {
      $type = $properties["building:use"];
    }
    if (!$type) {
      $type = $properties["amenity"];
    }

    switch ($type) {
      case "apartments":
      case "house":
      case "residential":
      case "hut":
        return "living";
      case "church":
        return "worship";
    }
    return "nonliving";
  }

  private function filterProperties($properties) {
    $height = 0;
    $minHeight = 0;
    if ($properties["height"]) {
      $height = $properties["height"];
    }
    if (!$height && $properties["building:height"]) {
      $height = $properties["building:height"];
    }
    if (!$height && $properties["levels"]) {
      $height = round($properties["levels"]*$this->METERS_PER_LEVEL);
    }
    if (!$height && $properties["building:levels"]) {
      $height = round($properties["building:levels"]*$this->METERS_PER_LEVEL);
    }

    // min_height
    if ($properties["min_height"]) {
      $minHeight = $properties["min_height"];
    }
    if (!$minHeight && $properties["building:min_height"]) {
      $minHeight = $properties["building:min_height"];
    }

    if (!$minHeight && $properties["min_level"]) {
      $minHeight = round($properties["min_level"]*$this->METERS_PER_LEVEL);
    }
    if (!$minHeight && $properties["building:min_level"]) {
      $minHeight = round($properties["building:min_level"]*$this->METERS_PER_LEVEL);
    }

    // wall material
    if ($properties["building:material"]) {
      $wallColor = $this->getMaterialColor($properties["building:material"]);
    }
    if ($properties["building:facade:material"]) {
      $wallColor = $this->getMaterialColor($properties["building:facade:material"]);
    }
    if ($properties["building:cladding"]) {
      $wallColor = $this->getMaterialColor($properties["building:cladding"]);
    }
    // wall color
    if ($properties["building:color"]) {
      $wallColor = $properties["building:color"];
    }
    if ($properties["building:colour"]) {
      $wallColor = $properties["building:colour"];
    }

    // roof material
    if ($properties["roof:material"]) {
      $roofColor = $this->getMaterialColor($properties["roof:material"]);
    }
    if ($properties["building:roof:material"]) {
      $roofColor = $this->getMaterialColor($properties["building:roof:material"]);
    }
    // roof color
    if ($properties["roof:color"]) {
      $roofColor = $properties["roof:color"];
    }
    if ($properties["roof:colour"]) {
      $roofColor = $properties["roof:colour"];
    }
    if ($properties["building:roof:color"]) {
      $roofColor = $properties["building:roof:color"];
    }
    if ($properties["building:roof:colour"]) {
      $roofColor = $properties["building:roof:colour"];
    }

    return array(
      "id"        => $properties["id"],
      "type"      => $this->getBuildingType($properties),
      "height"    => $height,
      "minHeight" => $minHeight,
      "wallColor" => $wallColor,
      "roofColor" => $roofColor
    );
  }
};
?>