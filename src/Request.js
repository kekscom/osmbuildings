
let cacheData = {};
let cacheIndex = [];
let cacheSize = 0;
let maxCacheSize = 1024*1024 * 5; // 5MB

function xhr (url, callback) {
  if (cacheData[url]) {
    if (callback) {
      callback(cacheData[url]);
    }
    return;
  }

  const req = new XMLHttpRequest();

  req.onreadystatechange = function () {
    if (req.readyState !== 4) {
      return;
    }
    if (!req.status || req.status < 200 || req.status > 299) {
      return;
    }
    if (callback && req.responseText) {
      const responseText = req.responseText;

      cacheData[url] = responseText;
      cacheIndex.push({ url: url, size: responseText.length });
      cacheSize += responseText.length;

      callback(responseText);

      while (cacheSize > maxCacheSize) {
        let item = cacheIndex.shift();
        cacheSize -= item.size;
        delete cacheData[item.url];
      }
    }
  };

  req.open('GET', url);
  req.send(null);

  return req;
}

class Request {

  static loadJSON (url, callback) {
    return xhr(url, responseText => {
      let json;
      try {
        json = JSON.parse(responseText);
      } catch(ex) {}

      callback(json);
    });
  }
}
