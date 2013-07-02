function setCamOffset(x, y) {
    camX = halfWidth + x;
    camY = height    + y;
}

function setMaxZoom(z) {
    maxZoom = z;
}

function setDate(date) {
    Shadows.setDate(date);
}

function loadData(url) {
    Data.load(url);
}

function setData(data) {
    Data.set(data);
}
