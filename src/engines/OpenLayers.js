// new OpenLayers.Layer.Buildings('name?', layerOptions);
// new OpenLayers.Layer.Google('Google Physical', { type: G_PHYSICAL_MAP });
// new OpenLayers.Layer.GML("GeoJSON", "geo.json", {
//     projection: new OpenLayers.Projection("EPSG:4326"),
//     format: OpenLayers.Format.GeoJSON
// });
// map.addLayer(...);


        OpenLayers.Layer.Buildings = OpenLayers.Class(OpenLayers.Layer, {
            CLASS_NAME: 'OpenLayers.Layer.Buildings',
            isBaseLayer: false,
            alwaysInRange: true,
            attribution: 'Buildings &copy; <a href="http://osmbuildings.org">OSM Buildings</a>',

            initialize: function(name, options) {
                OpenLayers.Layer.prototype.initialize.apply( this, [name, options] );
            },

            updateOrigin: function() {
                var origin = this.map.getLonLatFromPixel( new OpenLayers.Pixel( 0, 0 ))
                    .transform( this.map.getProjectionObject(), new OpenLayers.Projection( "EPSG:4326" ) );
                var originPx = geoToPixel( origin.lat, origin.lon );
                setOrigin( originPx.x, originPx.y );
            },

            setMap: function(map) {
                if( !this.map ) {
                    OpenLayers.Layer.prototype.setMap.apply( this, arguments );
                    createCanvas( this.div );
                    var newSize = this.map.getSize();
                    setSize( newSize.w, newSize.h );
                    setZoom( this.map.getZoom() );
                    this.updateOrigin();
                    loadData();
                }
            },

            removeMap: function(map) {
                canvas.parentNode.removeChild( canvas );
                OpenLayers.Layer.prototype.removeMap.apply( this, arguments );
            },

            onMapResize: function() {
                OpenLayers.Layer.prototype.onMapResize.apply( this, arguments );
                var newSize = this.map.getSize();
                setSize( newSize.w, newSize.h );
                render();
            },

            moveTo: function(bounds, zoomChanged, dragging) {
                var result = OpenLayers.Layer.prototype.moveTo.apply( this, arguments );
                if(!dragging) {
                    var offsetLeft = parseInt( this.map.layerContainerDiv.style.left, 10 );
                    offsetLeft = -Math.round( offsetLeft );
                    var offsetTop = parseInt( this.map.layerContainerDiv.style.top, 10 );
                    offsetTop = -Math.round( offsetTop );

                    this.div.style.left = offsetLeft + 'px';
                    this.div.style.top = offsetTop + 'px';
                }

                if (zoomChanged){
                    setZoom( this.map.getZoom() );
                    if (rawData) {
                        data = scaleData( rawData );
                    }
                }

                this.updateOrigin();
                camX = halfWidth;
                camY = height;
                render();
                onMoveEnd( {} );
                return result;
            },

            moveByPx: function(dx, dy) {
                var result = OpenLayers.Layer.prototype.moveByPx.apply( this, arguments );
                camX += dx;
                camY += dy;
                render();
                return result;
            }
        });

        osmb.VERSION += '-openlayers';

        osmb.addTo = function( map ) {
            this.layer = new OpenLayers.Layer.Buildings( 'OSMBuildings', this );
            map.addLayer( this.layer );
            return this;
        };
