exports.create = function() {

  var
    ns = 'http://www.w3.org/2000/svg',
    style = {},
    doc = document.createElement('SVG'),
    el,
    coordinates = [];

  doc.setAttributeNS(ns, 'xmlns', 'http://www.w3.org/2000/svg');
  doc.setAttributeNS(ns, 'version', 1.1);

  var canvas = {
    style: {}
  };

  canvas.getContext = function(type) {
    if (type === '2d') {
      return context;
    }
  };

  canvas.toDataURL = function() {
//  res += '<?xml version="1.0" standalone="no"?>\n';
//  res += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
//  viewBox= [min.x, min.y, width, height].join(' ')
    doc.setAttributeNS(ns, 'width', (canvas.width || 1));
    doc.setAttributeNS(ns, 'height', (canvas.height || 1));
    return doc.toString();
  };

  var context = {};

  context.arc = function(x, y, r, start, end, clockwise) {};

  context.clearRect = function() {
    while (doc.removeChild(doc.firstChild));
  };

  context.beginPath = function() {
    doc.appendchild(el = document.createElementNS(ns, 'path'));
    coordinates = [];
  };

  context.closePath = function() {
    coordinates.push('z');
    el.setAttributeNS(ns, 'd', coordinates.join(' '));
  };

  context.moveTo = function(x, y) {
    coordinates.push('M', x, y);
  };

  context.lineTo = function(x, y) {
		coordinates.push('L', x, y);
  };

  context.stroke = function() {
    context.lineCap     && el.setAttributeNS(ns, 'stroke-linecap',  context.lineCap);
    context.lineJoin    && el.setAttributeNS(ns, 'stroke-linejoin', context.lineJoin);
    context.strokeStyle && el.setAttributeNS(ns, 'stroke',          context.strokeStyle);
    context.lineWidth   && el.setAttributeNS(ns, 'stroke-width',    context.lineWidth);
//  context.strokeStyle && (style['stroke-opacity']  = context.strokeStyle);
//  style += ('stroke-dasharray'] = options.dashArray;
  };

  context.fill = function() {
		context.fillStyle && el.setAttributeNS(ns, 'fill', context.fillStyle);
//  context.fillStyle && el.setAttributeNS(ns, 'fill-opacity', context.fillStyle);
  };

  context.drawImage = function(img, x, y) {};

  context.arc = function() {};
  context.bezierCurveTo = function() {};
  context.clearRect = function() {};
  context.getImageData = function() {};
  context.putImageData = function() {};

  context.fillStyle = null;
  context.globalCompositeOperation = null;
  context.lineCap = null;
  context.lineJoin = null;
  context.lineWidth = null;
  context.mozImageSmoothingEnabled = null;
  context.shadowBlur = null;
  context.shadowColor = null;
  context.strokeStyle = null;
  context.webkitImageSmoothingEnabled = null;

  return canvas;
};
