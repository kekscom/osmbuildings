var State = (function() {
  'use strict';

  var REPEAT_TIMEOUT = 500;

  var _timer;

  function _isStorable(n) {
    return typeof n !== 'object' && typeof n !== 'function' && n !== undefined && n !== null && n !== '';
  }

  function _setUrlParams(data) {
    if (!history.replaceState) {
      return;
    }
    var k, v, params = [];
    for (k in data) {
      v = data[k];
      if (data.hasOwnProperty(k) && _isStorable(v)) {
        params.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      }
    }
    history.replaceState(data, '', '?'+ params.join('&'));
  }

  function _getUrlParams(data) {
    var params;
    data = data || {};
    if (!(params = location.search)) {
        return data;
    }
    params = params.substring(1).replace( /(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
      if ($1) {
        data[$1] = $2;
      }
    });
    return data;
  }

  function _setLocalStorage(data) {
    var k, v;
    try {
      for (k in data) {
        v = data[k];
        if (data.hasOwnProperty(k) && _isStorable(v)) {
          localStorage.setItem(k, v);
        }
      }
    } catch(ex) {}
  }

  function _getLocalStorage(data) {
    var k;
    data = data || {};

    try {
      for (k in localStorage){
        data[k] = localStorage.getItem(k);
      }
    } catch(ex) {}
    return data;
  }

  var me = {};

  me.save = function(data) {
    clearTimeout(_timer);
    _timer = setTimeout(function() {
      _setLocalStorage(data);
      _setUrlParams(data);
    }, REPEAT_TIMEOUT);
  };

  me.load = function() {
    var data = {};
    data = _getLocalStorage(data);
    data = _getUrlParams(data);
    return data;
  };

  return me;
}());
