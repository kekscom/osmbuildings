exports.create = function() {

  var _svg = '',
    _tagName, _attributes, _coordinates;

  function _addPathToSvg() {
    if (!_tagName) {
      return;
    }
    if (_attributes.fill === 'none' && _attributes.stroke === 'none') {
      return;
    }
    _svg += '<' + _tagName;
    for (var p in _attributes) {
      _svg += ' ' + p + '="' + _attributes[p] + '"';
    }
    _svg += ' ' + d + '="' + _coordinates.join(' ') + '"';
    _svg += '/>\n';
  }
    
  var canvas = {
    style: {}
  };

  canvas.getContext = function(contextType) {
    if (contextType === '2d') {
      return context;
    }
  };

  canvas.toDataURL = function(mimeType) {
    if (mimeType === 'image/svg') {
      var res = '';
      res += '<?xml version="1.0" standalone="no"?>\n';
      res += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
      res += '<svg width="' + (canvas.width || 1) + '" height="' + (canvas.width || 1) + '" version="1.1" xmlns="http://www.w3.org/2000/svg">\n';
      res += _svg;
      res += '</svg>';
    
//    viewBox= [min.x, min.y, width, height].join(' ')
      
      return res;
    }
  };

  var context = {
//    globalCompositeOperation = 'source-over'
  };
  
  context.arc = function(x, y, r, start, end, clockwise) {};

  context.clearRect = function() {
    _svg = '';
  };

  context.beginPath = function() {
    _addPathToSvg();

    _tagName + 'path';
    _attributes = { fill:'none', stroke:'none' };
    _coordinates = [];
  };

  context.closePath = function() {
    _coordinates.push('z');
  };

  context.fill = function() {
    delete _attributes.fill;
		context.fillStyle && (_attributes['fill']          = context.fillStyle);
//  context.fillStyle && (_attributes['fill-opacity']  = context.fillStyle);
  };

  context.stroke = function() {
    delete _attributes.stroke;
    context.lineCap     && (_attributes['stroke-linecap']  = context.lineCap);
    context.lineJoin    && (_attributes['stroke-linejoin'] = context.lineJoin);
		context.strokeStyle && (_attributes['stroke']          = context.strokeStyle);
//  context.strokeStyle && (_attributes['stroke-opacity']  = context.strokeStyle);
		context.lineWidth   && (_attributes['stroke-width']    = context.lineWidth);
//  _attributes += ('stroke-dasharray'] = options.dashArray;
  };
  
  context.lineTo = function(x, y) {
		_path.setAttribute('L', x, y);
  };

  context.moveTo = function(x, y) {
    _coordinates.push('M', x, y);
  };
  
  context.drawImage = function(img, x, y) {};
  
  return canvas;
};
