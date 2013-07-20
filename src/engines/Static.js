var osmb = function(w, h, bbox) {
    Layers.appendTo(doc.body);

//  maxZoom = 20; => which zoomlevel?
    zoom = maxZoom;

//  var po = map.getPixelOrigin();
    var po = { x:0, y:0 };

    setSize({ w:w, h:h });
    setOrigin({ x:po.x, y:po.y });
    setZoom(zoom);

    Data.update();
    renderAll();
};

var proto = osmb.prototype;
