function loadFile(url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send(null);

  var s = xhr.status;
  if (s !== 0 && s !== 200 && s !== 1223) {
    var err = Error(xhr.status +' failed to load '+ url);
    err.status = xhr.status;
    err.responseText = xhr.responseText;
    throw err;
  }

  return xhr.responseText;
}

var exports = {};
eval(loadFile('files.js'));
var srcFiles = exports;

var file, str, js = '';
for (var i = 0; i < srcFiles.length; i++) {
  file = srcFiles[i].replace('{engine}', 'Leaflet');
  str = loadFile(file);
  js += '//****** file: ' + file + ' ******\n\n';
  js += str + '\n\n';
}

try {
  eval(js);
} catch (ex) {
  console.error(ex);
}
