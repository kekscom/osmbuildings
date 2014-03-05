/**
 * @name Extruded Feature Layer
 * @author: Nianwei Liu
 * @fileoverview
 * A canvas based ESRI ArcGIS Server JavaScript API ported from Open Streem Map Buildings.(osmbuildings.org).
 */

/*(function() {
    if (!window.OSMBuildings) {
        // only include minimal filters: invert and desaturate. If need more, include the pixastic.all.js in header before require this.
        var src = dojo.moduleUrl('agsjs', 'osm/OSMBuildings.js');
        var s = dojo.create('script', {
            type: 'text/javascript',
            src: src
        });
        dojo.doc.getElementsByTagName('head')[0].appendChild(s);
    }
}());
*/
// ********* end of osm *******************/

// TODO get rid of dojo

dojo.provide('agsjs.layers.BuildingsLayer');

dojo.declare('agsjs.layers.BuildingsLayer', esri.layers.Layer, {
    _osmb: null,
    _container: null,
    _tileInfo: null,
    _mode: 0,// ON_DEMAND|SNAPSHOT
    _heightAttribute: '',
    _oidField: null,// will be overridden from meta query
    _query: null,
    _task: null,
    _oids: null, //track current objectids to mark new/old for animation fade in
    _featureExt: null,//current feature extent, 1.5 map extent
    _suspendOnPan: false,//whether to suspend drawing during map panning. default is false.
    // set to true if performance is not optimal (non-Chrome browsers);

    /**
    * @name BuildingsLayerOptions
    * @class This is an object literal that specify the options for each BuildingsLayer.
    * @property {string} heightAttribute required. name of the attribute for height;
    * @property {number} defaultHeight optional. default Height to use if the height value is 0. default=0;
    * @property {number} heightScaleRatio optional. number used to multiple the value from service. default=1;
    * @property {number} extentScaleRatio optional. extra buffer on map extent to load features to reduce server traffic. default=1.5;
    * @property {int} [mode] optional. agsjs.layers.BuildingsLayer.MODE_ONDEMAND | MODE_SNAPSHOT. default=ON_DEMAND
    * @property {esri.tasks.Query} [query] optional. query set on the feature layer for retrieving data.
    * @property {Object} [style] object with color, roofColor (#ffcc00' 'rgb(255,200,200)' 'rgba(255,200,200,0.9))
    */
    /**
    * Create an BuildingsLayer
    * @name BuildingsLayer
    * @constructor
    * @class This class is a BuildingsLayer, such as a polygon feature layer with a height attribute.
    * @param {string||FeatureCollection} url
    * @param {BuildingsLayerOptions} opts
    */
    constructor: function(url, opts) {
       // Manually call superclass constructor with required arguments
       if (!(!!document.createElement('canvas').getContext)){
           throw new Error('Canvas unsupported. Try different browser');
       }
       this.inherited(arguments);
       opts = opts || {};
       this._heightAttribute = opts.heightAttribute;
       this._mode = opts.mode || agsjs.layers.BuildingsLayer.MODE_ONDEMAND;
       this._heightScaleRatio = opts.heightScaleRatio || 1;
       this._extentScaleRatio = opts.extentScaleRatio || 1.5;
       this._defaultHeight = opts.defaultHeight || 0;
       this._style = opts.style;
       // Deal with feature collection
       if (dojo.isObject(url) && url.featureSet) {
           this._mode = agsjs.layers.BuildingsLayer.MODE_SNAPSHOT;
           this._setFeatures(url.featureSet.features);
           this.loaded = true;
           this.onLoad(this);
       } else {
           this._url = url;
           // get meta data for layer
           new esri.request({
               url: this._url,
               content: {
                   f: 'json'
               },
               callbackParamName: 'callback'
           }).then(dojo.hitch(this, this._initLayer));
           this._query = new esri.tasks.Query();
           dojo.mixin(this._query, opts.query);
           dojo.mixin(this._query, {
               returnGeometry: true,
               outSpatialReference: { wkid: 4326 }
           });
           this._task = new esri.tasks.QueryTask(url);
           dojo.connect(this._task, 'onComplete', dojo.hitch(this, this._onQueryComplete));
           dojo.connect(this._task, 'onError', esri.config.defaults.io.errorHandler);
       }
   },

    /**********************
    * @see http://help.arcgis.com/en/webapi/javascript/arcgis/samples/exp_rasterlayer/javascript/RasterLayer.js
    * Internal Properties
    *
    * _map
    * _element
    * _context
    * _mapWidth
    * _mapHeight
    * _connects
    **********************/
   _setMap: function(map, container, ind, lod) {
       this._map = map;

       var element = dojo.create('div', {
           width: map.width + 'px',
           height: map.height + 'px',
           style: 'position: absolute; left: 0px; top: 0px;'
       }, container);
       this._osmb = new OSMBuildings();
       // allow attribution widget to add copyright text
       this.suspended = false;
       this.copyright = OSMBuildings.ATTRIBUTION + ',' + this.copyrightText;

       this._element = element;
       this._container = this._osmb.appendTo(element);
       this._osmb.setSize(map.width, map.height);
       // calc orgins
       //9241483,13264618
       if (map.layerIds.length == 0 || !map.getLayer(map.layerIds[0]).tileInfo) {
           throw new Error('must have at least one tiled layer added before this layer');
       }
       this._tileInfo = map.getLayer(map.layerIds[0]).tileInfo;
       this._osmb.setZoom(map.getLevel()); // ! assume basemap is tiled.
       this._setOrigin();

       this._loadData();
       // Event connections
       this._connects = [];
       this._connects.push(dojo.connect(map, 'onResize', this, this._onResize));
       this._connects.push(dojo.connect(map, 'onPan', this, this._onPan));
       this._connects.push(dojo.connect(map, 'onExtentChange', this, this._onExtentChange));
       this._connects.push(dojo.connect(map, 'onZoomStart', this, this._onZoomStart));
       return element;
   },
   // esri.layers.Layer.method
   _unsetMap: function(map, container) {
       if (this._osmb) {
           this._container.parentNode.removeChild(this._container);
           this._osmb = null;
       }
       dojo.forEach(this._connects, dojo.disconnect, dojo);
       if (this._element) {
           container.removeChild(this._element);
       }
       this._map = null;
       this._element = null;
   },
   _initLayer: function(json) {
       //dojo.mixin(this, json);
       this.setMinScale(json.minScale || 0);
       this.setMaxScale (json.maxScale || 0);
       this.copyrightText = json.copyrightText;
       dojo.some(json.fields, function(field, i) {
           if (field.type == 'esriFieldTypeOID') {
               this._oidField = field.name;
               return true;
           }
           return false;
       }, this);
       this._query.outFields = [this._oidField, this._heightAttribute];
       this.loaded = true;
       this.onLoad(this);
   },
   _setOrigin: function(dx, dy) {
       var resolution = this._tileInfo.lods[this._map.getLevel()].resolution; //map.getScale()/12/96/3.28084; //inch_pre_ft/px_per_in/ft_per_mt;
       var topLeft = this._map.toMap(new esri.geometry.Point(0, 0));
       var x = Math.round((topLeft.x - this._tileInfo.origin.x) / resolution);
       var y = Math.round((this._tileInfo.origin.y - topLeft.y) / resolution);
       this._osmb.setOrigin(x+(dx||0), y+(dy||0));
       this._osmb.setSize(this._map.width, this._map.height);

   },
   _onResize: function(extent, width, height) {
       if (this._osmb) {
           this._osmb.setSize(width,height );
           this._osmb.render();
       }
   },
   _onPan: function(extent, delta) {
       if (this._suspendOnPan){
        dojo.style(this._container, {
           left: delta.x + 'px',
           top: delta.y + 'px'
        });
        //this._osmb.setCamOffset(-delta.x, -delta.y);
       } else {
           this._setOrigin(-delta.x, -delta.y);
           this._osmb.render();
       }
   },
   _onExtentChange: function(extent, delta, levelChange, lod) {
       dojo.style(this._container, {
           left: 0,
           top: 0
       });
       this._setOrigin();
       this._osmb.setCamOffset(0, 0);
       if (levelChange) {
           this._osmb.onZoomEnd({
               zoom: this._map.getLevel()
           });

           if (this.isVisibleAtScale(this._map.getScale())) {
               this._loadData();
           } else {
               // clear canvas. Current OSMB does not handle null or {} as no feature.
               this._osmb.geoJSON({
                   features: []
               });
           }
       } else {
           this._osmb.onMoveEnd();
           if (this._featureExt && !this._featureExt.contains(extent)) {
               this._loadData();
           }
       }
   },
   _onZoomStart: function(extent, zoomFactor, anchor, level) {
       // actually clear the
       this._osmb.onZoomStart();
   },
   _setFeatures: function(features) {
       var oids = {};
       var jfs = [];
       this._oids = this._oids ||{};
       for (var i = 0; i < features.length; i++) {
           var f = features[i];

           var oid = f.attributes[this._oidField];
           var gj = {
               type: 'Feature',
               geometry: {
                   type: 'Polygon',
                   coordinates: f.geometry.rings
               },
               properties: {
                   height: (f.attributes[this._heightAttribute] || this._defaultHeight) * this._heightScaleRatio,
                   isNew: !this._oids[oid]
               }
           }
           // find out the y coords range for sorting
           var minY = maxY = f.geometry.rings[0][0][1];
           for (var j = 0; j < f.geometry.rings.length;    j++){
               for (var k = 0; k < f.geometry.rings[j].length; k++){
                   minY = Math.min(minY,f.geometry.rings[j][k][1] );
                   maxY = Math.max(maxY,f.geometry.rings[j][k][1] );
               }
           }
           gj.minY = minY;
           gj.maxY = maxY;
           jfs[i] = gj;
           oids[oid] = f;
       }
       // sort features by height and y coord desc for potential drawing improvement
       jfs.sort(function (a, b){
        // if polygon a is completely north of b then put a first.
        // otherwise put the taller one first.
        // this ensures north/taller poly draw first
        if (a.maxY < b.minY){
               return 1;
           } else if (a.minY > b.maxY){
               return -1;
           } else {
               return b.properties.height - a.properties.height
           }
       });
       this._oids = oids;
       this._osmb.geoJSON({
           type: 'FeatureCollection',
           features: jfs
       });
       if (this._style) {
           this._osmb.setStyle(this._style);
       }
   },
   _loadData: function() {
       if (this._mode == agsjs.layers.BuildingsLayer.MODE_SNAPSHOT) {
           if (this._oids) {
               return;
           } else {
               this._query.geometry = null;
               this._query.where = this._query.where || '1=1';

           }
       } else {
           this._featureExt = this._map.extent.expand(this._extentScaleRatio);
           this._query.geometry = this._featureExt;
       }
       this._task.execute(this._query);
   },
   _onQueryComplete: function(featureSet) {
       this._setFeatures(featureSet.features);
   }
});

dojo.mixin(agsjs.layers.BuildingsLayer, {
    MODE_ONDEMAND: 0,
    MODE_SNAPSHOT: 1
});
