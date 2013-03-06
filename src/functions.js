function createCanvas(container) {
    var canvas = doc.createElement('CANVAS');
    canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
    canvas.style.imageRendering = 'optimizeSpeed';
    canvas.style.position = 'absolute';
    canvas.style.left = 0;
    canvas.style.top = 0;
    container.appendChild(canvas);

    var context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 1;

    try {
        context.mozImageSmoothingEnabled = false;
    } catch (err) {
    }

    return canvas;
}

function createContainer(parentNode) {
    container = doc.createElement('DIV');
    container.style.pointerEvents = 'none';
    container.style.position = 'absolute';
    container.style.left = 0;
    container.style.top = 0;

    shadows.init(container);

    canvas = createCanvas(container);
    context = canvas.getContext('2d');

    parentNode.appendChild(container);
    return container;
}

function destroyContainer() {
//    shadows.destroy();
    container.parentNode.removeChild(container);
}

function pixelToGeo(x, y) {
    var res = {};
    x /= size;
    y /= size;
    res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : RAD * (2 * atan(exp(PI * (1 - 2 * y))) - HALF_PI),
    res[LON] = (x === 1 ?  1 : (x % 1 + 1) % 1) * 360 - 180;
    return res;
}

function geoToPixel(lat, lon) {
    var latitude = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
        longitude = lon / 360 + 0.5
    ;
    return {
        x: longitude * size << 0,
        y: latitude  * size << 0
    };
}

function template(str, data) {
    return str.replace(/\{ *([\w_]+) *\}/g, function (x, key) {
        return data[key];
    });
}

function fromRange(sVal, sMin, sMax, dMin, dMax) {
    sVal = min(max(sVal, sMin), sMax);
    var rel = (sVal - sMin) / (sMax - sMin),
        range = dMax - dMin;
    return min(max(dMin + rel * range, dMin), dMax);
}
