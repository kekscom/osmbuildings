
function loadFile(url) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send(null);

  let s = xhr.status;
  if (s !== 0 && s !== 200 && s !== 1223) {
    let err = Error(xhr.status +' failed to load '+ url);
    err.status = xhr.status;
    err.responseText = xhr.responseText;
    throw err;
  }

  return xhr.responseText;
}

let config = JSON.parse(loadFile('files.json'));

let exports = {};
let js = '';
config.js.map(function(file) {
  file = file.replace('{engine}', 'Leaflet');
  js += '//****** file: ' + file + ' ******\n\n';
  js += loadFile(file) + '\n\n';
});

try {
  eval(js);
} catch (ex) {
  console.error(ex);
}
