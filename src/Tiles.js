L.TileLayer = {

	tileSize: 256,

	_update: function() {
		var bounds = this._map.getPixelBounds(),
		    zoom = this._map.getZoom(),
		    tileSize = this.tileSize;

		var nwTilePoint = new L.Point(Math.floor(bounds.min.x / tileSize), Math.floor(bounds.min.y / tileSize)),
		    seTilePoint = new L.Point(Math.floor(bounds.max.x / tileSize), Math.floor(bounds.max.y / tileSize)),
		    tileBounds  = new L.Bounds(nwTilePoint, seTilePoint);

		this._addTilesFromCenterOut(tileBounds);
		this._removeOtherTiles(tileBounds);
	},

	_addTilesFromCenterOut: function(bounds) {
		var queue = [],
		    center = bounds.getCenter();

		var j, i, point;

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				point = new L.Point(i, j);
				if (this._tileShouldBeLoaded(point)) {
					queue.push(point);
				}
			}
		}

		var tilesToLoad = queue.length;

		if (tilesToLoad === 0) {
			return;
		}

		// load tiles in order of their distance to center
		queue.sort(function(a, b) {
			return a.distanceTo(center) - b.distanceTo(center);
		});

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(queue[i], fragment);
		}
	},

	_tileShouldBeLoaded: function(tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		if (!this.continuousWorld) {
			var limit = this._getWrapTileNum();

			if (this.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit) || tilePoint.y < 0 || tilePoint.y >= limit) {
				return false; // exceeds world bounds
			}
		}

		return true;
	},

	_removeOtherTiles: function(bounds) {
		var kArr, x, y, key;

		for (key in this._tiles) {
			if (this._tiles.hasOwnProperty(key)) {
				kArr = key.split(':');
				x = parseInt(kArr[0], 10);
				y = parseInt(kArr[1], 10);

				// remove tile if it's out of bounds
				if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
					this._removeTile(key);
				}
			}
		}
	},

	_removeTile: function(key) {
		var tile = this._tiles[key];

		this.fire("tileunload", {tile: tile, url: tile.src});
		this._container.removeChild(tile);

		// for https://github.com/CloudMade/Leaflet/issues/137
		if (!L.Browser.android) {
			tile.src = L.Util.emptyImageUrl;
		}

		delete this._tiles[key];
	},

	_addTile: function(tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint);

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		Android 3 browser not tested
		Android 2 browser requires top/left or tiles disappear on load or first drag
		(reappear after zoom) https://github.com/CloudMade/Leaflet/issues/866
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;

		this._loadTile(tile, tilePoint);

		if (tile.parentNode !== this._container) {
			container.appendChild(tile);
		}
	},

	_getTilePos: function(tilePoint) {
		var origin = this._map.getPixelOrigin(),
		    tileSize = this.tileSize;

		return tilePoint.multiplyBy(tileSize).subtract(origin);
	},

	getTileUrl: function(tilePoint) {
		this._adjustTilePoint(tilePoint);
		return L.Util.template(this._url, { x:tilePoint.x, y:tilePoint.y });
	},

	_adjustTilePoint: function(tilePoint) {
		var limit = Math.pow(2, this._map.getZoom());

		// wrap tile coordinates
		if (!this.continuousWorld && !this.noWrap) {
			tilePoint.x = ((tilePoint.x % limit) + limit) % limit;
		}

		if (this.tms) {
			tilePoint.y = limit - tilePoint.y - 1;
		}
	},

	_loadTile: function(tile, tilePoint) {
		tile.src = this.getTileUrl(tilePoint);
    }
};
