var baseUrl = location.protocol +'//'+ location.host + location.pathname.replace(/[^\/]+$/, '') + '../';

function loadFile(url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', baseUrl + url, false);
  xhr.send(null);

  var s = xhr.status;
  if (s !== 0 && s !== 200 && s !== 1223) {
    var err = Error(xhr.status +' failed to load '+ baseUrl + url);
    err.status = xhr.status;
    err.responseText = xhr.responseText;
    throw err;
  }

  return xhr.responseText;
}

var exports = {};
eval(loadFile('build/config.js'));
var config = exports;

var file, str, js = '';
for (var i = 0; i < config.srcFiles.length; i++) {
  file = config.srcFiles[i].replace('{engine}', 'Leaflet');
  str = loadFile('dummy/' + file);
  js += '//****** file: ' + file + ' ******\n\n';
  js += str + '\n\n';
}

try {
  eval(js);
} catch (ex) {
  console.error(ex);
}
