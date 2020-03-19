// Map
import Map from 'ol/Map.js';
import View from 'ol/View.js';
// Layers
import { Tile as TileLayer} from 'ol/layer.js';
// Sources
import OSM from 'ol/source/OSM.js';
// Controls
import { defaults as defaultControls, Control } from 'ol/control.js';
// Proj
import * as olProj from "ol/proj.js";
// OSM Buildings
import OSMBuildings from './OSMBuildings-OL5.js';

let map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  controls: defaultControls({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  target: 'map',
  view: new View({
    center: olProj.transform([13.33522, 52.50440], 'EPSG:4326', 'EPSG:3857'),
    zoom: 16
  })
});

// Building example
let osmBuildings = new OSMBuildings(map);
osmBuildings.date(new Date(2017, 5, 15, 17, 30))
osmBuildings.load();

osmBuildings.click(function(e) {
    let result = osmBuildings.getDataItems().filter(obj => {
        return obj.id === e.feature
    })
    alert("Height (m): " + result[0].realHeight);
    //console.log(result);
  });

