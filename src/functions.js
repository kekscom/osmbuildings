function pixelToGeo(x, y) {
  var res = {};
  x /= size;
  y /= size;
  res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : RAD * (2 * atan(exp(PI * (1 - 2*y))) - HALF_PI),
  res[LON] = (x === 1 ?  1 : (x%1 + 1) % 1) * 360 - 180;
  return res;
}

function geoToPixel(lat, lon) {
  var latitude  = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
    longitude = lon/360 + 0.5;
  return {
    x: longitude*size <<0,
    y: latitude *size <<0
  };
}

function fromRange(sVal, sMin, sMax, dMin, dMax) {
  sVal = min(max(sVal, sMin), sMax);
  var rel = (sVal-sMin) / (sMax-sMin),
    range = dMax-dMin;
  return min(max(dMin + rel*range, dMin), dMax);
}

function xhr(url, param, callback) {
  url = url.replace(/\{ *([\w_]+) *\}/g, function(tag, key) {
    return param[key] || tag;
  });

  var req = 'XDomainRequest' in win ? new XDomainRequest() : new XMLHttpRequest();

  function changeState(state) {
    if ('XDomainRequest' in win && state !== req.readyState) {
      req.readyState = state;
      if (req.onreadystatechange) {
        req.onreadystatechange();
      }
    }
  }

  req.onerror = function() {
    req.status = 500;
    req.statusText = 'Error';
    changeState(4);
  };

  req.ontimeout = function() {
    req.status = 408;
    req.statusText = 'Timeout';
    changeState(4);
  };

  req.onprogress = function() {
    changeState(3);
  };

  req.onload = function() {
    req.status = 200;
    req.statusText = 'Ok';
    changeState(4);
  };

  req.onreadystatechange = function() {
    if (req.readyState !== 4) {
      return;
    }
    if (!req.status || req.status < 200 || req.status > 299) {
      return;
    }
    if (callback && req.responseText) {
      callback(JSON.parse(req.responseText));
    }
  };

  changeState(0);
  req.open('GET', url);
  changeState(1);
  req.send(null);
  changeState(2);

  return req;
}
