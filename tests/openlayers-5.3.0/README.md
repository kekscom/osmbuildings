# OpenLayers 5 OSM Buildings Support

1. Install dependencies from package.json.
```bash
npm install
```
2. Run local server for testing live updates at localhost:1234.
```bash
npm run-script start
```
3. Build the production bundle. Copy the dist/ folder to your production server.
```bash
npm run-script build
```

# Example code (See index.js and index.html for full example)
```javascript
import OSMBuildings from './OSMBuildings-OL5.js';
...
let osmBuildings = new OSMBuildings(map);
osmBuildings.date(new Date(2017, 5, 15, 17, 30))
osmBuildings.load();

osmBuildings.click(function(e) {
    let result = osmBuildings.getDataItems().filter(obj => {
        return obj.id === e.feature
    })
    alert("Height (m): " + result[0].realHeight);
  });
```





