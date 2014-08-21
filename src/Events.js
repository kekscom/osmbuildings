
var eventListeners = {};

function addListener(type, listener, scope) {
  var listeners = eventListeners[type] || (eventListeners[type] = []);
  listeners.push(function(payload) {
    return listener.call(scope, payload);
  });
}

function emit(type, payload) {
  if (!eventListeners[type]) {
    return;
  }
  var listeners = eventListeners[type];
  for (var i = 0, il = listeners.length; i < il; i++) {
    listeners[i](payload);
  }
}
