/**
 * Copyright (C) 2019 OSM Buildings, Jan Marsch
 * A JavaScript library for visualizing building geometry on interactive maps.
 * @osmbuildings, http://osmbuildings.org
 */

import { Vector as VectorLayer } from "ol/layer.js";
import VectorSource from "ol/source/Vector.js";
import { inherits as olInherits } from "ol/util.js";
import * as olProj from "ol/proj.js";

//****** file: Block.js ******
class Block {
    constructor() {}

    draw(
        context,
        polygon,
        innerPolygons,
        height,
        minHeight,
        color,
        altColor,
        roofColor
    ) {
        var i,
            il,
            roof = this._extrude(
                context,
                polygon,
                height,
                minHeight,
                color,
                altColor
            ),
            innerRoofs = [];

        if (innerPolygons) {
            for (i = 0, il = innerPolygons.length; i < il; i++) {
                innerRoofs[i] = this._extrude(
                    context,
                    innerPolygons[i],
                    height,
                    minHeight,
                    color,
                    altColor
                );
            }
        }

        context.fillStyle = roofColor;

        context.beginPath();
        this._ring(context, roof);
        if (innerPolygons) {
            for (i = 0, il = innerRoofs.length; i < il; i++) {
                this._ring(context, innerRoofs[i]);
            }
        }
        context.closePath();
        context.stroke();
        context.fill();
    }

    _extrude(context, polygon, height, minHeight, color, altColor) {
        var scale = CAM_Z / (CAM_Z - height),
            minScale = CAM_Z / (CAM_Z - minHeight),
            a = {
                x: 0,
                y: 0
            },
            b = {
                x: 0,
                y: 0
            },
            _a,
            _b,
            roof = [];

        for (var i = 0, il = polygon.length - 3; i < il; i += 2) {
            a.x = polygon[i] - ORIGIN_X;
            a.y = polygon[i + 1] - ORIGIN_Y;
            b.x = polygon[i + 2] - ORIGIN_X;
            b.y = polygon[i + 3] - ORIGIN_Y;

            _a = buildings.project(a, scale);
            _b = buildings.project(b, scale);

            if (minHeight) {
                a = buildings.project(a, minScale);
                b = buildings.project(b, minScale);
            }

            // backface culling check
            if ((b.x - a.x) * (_a.y - a.y) > (_a.x - a.x) * (b.y - a.y)) {
                // depending on direction, set wall shading
                if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
                    context.fillStyle = altColor;
                } else {
                    context.fillStyle = color;
                }

                context.beginPath();
                this._ring(context, [b.x, b.y, a.x, a.y, _a.x, _a.y, _b.x, _b.y]);
                context.closePath();
                context.fill();
            }

            roof[i] = _a.x;
            roof[i + 1] = _a.y;
        }

        return roof;
    }

    _ring(context, polygon) {
        context.moveTo(polygon[0], polygon[1]);
        for (var i = 2, il = polygon.length - 1; i < il; i += 2) {
            context.lineTo(polygon[i], polygon[i + 1]);
        }
    }

    simplified(context, polygon, innerPolygons) {
        context.beginPath();
        this._ringAbs(context, polygon);
        if (innerPolygons) {
            for (var i = 0, il = innerPolygons.length; i < il; i++) {
                this._ringAbs(context, innerPolygons[i]);
            }
        }
        context.closePath();
        context.stroke();
        context.fill();
    }

    _ringAbs(context, polygon) {
        context.moveTo(polygon[0] - ORIGIN_X, polygon[1] - ORIGIN_Y);
        for (var i = 2, il = polygon.length - 1; i < il; i += 2) {
            context.lineTo(polygon[i] - ORIGIN_X, polygon[i + 1] - ORIGIN_Y);
        }
    }

    shadow(context, polygon, innerPolygons, height, minHeight) {
        var mode = null,
            a = {
                x: 0,
                y: 0
            },
            b = {
                x: 0,
                y: 0
            },
            _a,
            _b;

        for (var i = 0, il = polygon.length - 3; i < il; i += 2) {
            a.x = polygon[i] - ORIGIN_X;
            a.y = polygon[i + 1] - ORIGIN_Y;
            b.x = polygon[i + 2] - ORIGIN_X;
            b.y = polygon[i + 3] - ORIGIN_Y;

            _a = shadows.project(a, height);
            _b = shadows.project(b, height);

            if (minHeight) {
                a = shadows.project(a, minHeight);
                b = shadows.project(b, minHeight);
            }

            // mode 0: floor edges, mode 1: roof edges
            if ((b.x - a.x) * (_a.y - a.y) > (_a.x - a.x) * (b.y - a.y)) {
                if (mode === 1) {
                    context.lineTo(a.x, a.y);
                }
                mode = 0;
                if (!i) {
                    context.moveTo(a.x, a.y);
                }
                context.lineTo(b.x, b.y);
            } else {
                if (mode === 0) {
                    context.lineTo(_a.x, _a.y);
                }
                mode = 1;
                if (!i) {
                    context.moveTo(_a.x, _a.y);
                }
                context.lineTo(_b.x, _b.y);
            }
        }

        if (innerPolygons) {
            for (i = 0, il = innerPolygons.length; i < il; i++) {
                this._ringAbs(context, innerPolygons[i]);
            }
        }
    }

    shadowMask(context, polygon, innerPolygons) {
        this._ringAbs(context, polygon);
        if (innerPolygons) {
            for (var i = 0, il = innerPolygons.length; i < il; i++) {
                this._ringAbs(context, innerPolygons[i]);
            }
        }
    }

    hitArea(context, polygon, innerPolygons, height, minHeight, color) {
        var mode = null,
            a = {
                x: 0,
                y: 0
            },
            b = {
                x: 0,
                y: 0
            },
            scale = CAM_Z / (CAM_Z - height),
            minScale = CAM_Z / (CAM_Z - minHeight),
            _a,
            _b;

        context.fillStyle = color;
        context.beginPath();

        for (var i = 0, il = polygon.length - 3; i < il; i += 2) {
            a.x = polygon[i] - ORIGIN_X;
            a.y = polygon[i + 1] - ORIGIN_Y;
            b.x = polygon[i + 2] - ORIGIN_X;
            b.y = polygon[i + 3] - ORIGIN_Y;

            _a = buildings.project(a, scale);
            _b = buildings.project(b, scale);

            if (minHeight) {
                a = buildings.project(a, minScale);
                b = buildings.project(b, minScale);
            }

            // mode 0: floor edges, mode 1: roof edges
            if ((b.x - a.x) * (_a.y - a.y) > (_a.x - a.x) * (b.y - a.y)) {
                if (mode === 1) {
                    // mode is initially undefined
                    context.lineTo(a.x, a.y);
                }
                mode = 0;
                if (!i) {
                    context.moveTo(a.x, a.y);
                }
                context.lineTo(b.x, b.y);
            } else {
                if (mode === 0) {
                    // mode is initially undefined
                    context.lineTo(_a.x, _a.y);
                }
                mode = 1;
                if (!i) {
                    context.moveTo(_a.x, _a.y);
                }
                context.lineTo(_b.x, _b.y);
            }
        }

        context.closePath();
        context.fill();
    }
}

//****** file: Buildings.js ******
class Buildings {
    constructor() {
        this.data;
    }
    setData(data) {
        this.data = data;
    }

    project(p, m) {
        return {
            x: ((p.x - CAM_X) * m + CAM_X) << 0,
            y: ((p.y - CAM_Y) * m + CAM_Y) << 0
        };
    }

    render() {
        var context = this.context;
        context.clearRect(0, 0, WIDTH, HEIGHT);

        // show on high zoom levels only and avoid rendering during zoom
        if (ZOOM < MIN_ZOOM || isZooming) {
            return;
        }

        var item,
            h,
            mh,
            sortCam = {
                x: CAM_X + ORIGIN_X,
                y: CAM_Y + ORIGIN_Y
            },
            footprint,
            wallColor,
            altColor,
            roofColor,
            dataItems = this.data.getItems();

        dataItems.sort(function(a, b) {
            return (
                a.minHeight - b.minHeight ||
                Geometry.getDistance(b.center, sortCam) - Geometry.getDistance(a.center, sortCam) ||
                b.height - a.height
            );
        });

        var cylinder = new Cylinder();
        var pyramid = new Pyramid();
        var block = new Block();
        for (var i = 0, il = dataItems.length; i < il; i++) {
            item = dataItems[i];

            if (simplified.isSimple(item)) {
                continue;
            }

            footprint = item.footprint;

            if (!Functions.isVisible(footprint)) {
                continue;
            }

            // when fading in, use a dynamic height
            h = item.scale < 1 ? item.height * item.scale : item.height;

            mh = 0;
            if (item.minHeight) {
                mh = item.scale < 1 ? item.minHeight * item.scale : item.minHeight;
            }

            wallColor = item.wallColor || WALL_COLOR_STR;
            altColor = item.altColor || ALT_COLOR_STR;
            roofColor = item.roofColor || ROOF_COLOR_STR;
            context.strokeStyle = altColor;

            switch (item.shape) {
                case "cylinder":
                    cylinder.draw(
                        context,
                        item.center,
                        item.radius,
                        item.radius,
                        h,
                        mh,
                        wallColor,
                        altColor,
                        roofColor
                    );
                    break;
                case "cone":
                    cylinder.draw(
                        context,
                        item.center,
                        item.radius,
                        0,
                        h,
                        mh,
                        wallColor,
                        altColor
                    );
                    break;
                case "dome":
                    cylinder.draw(
                        context,
                        item.center,
                        item.radius,
                        item.radius / 2,
                        h,
                        mh,
                        wallColor,
                        altColor
                    );
                    break;
                case "sphere":
                    cylinder.draw(
                        context,
                        item.center,
                        item.radius,
                        item.radius,
                        h,
                        mh,
                        wallColor,
                        altColor,
                        roofColor
                    );
                    break;
                case "pyramid":
                    pyramid.draw(
                        context,
                        footprint,
                        item.center,
                        h,
                        mh,
                        wallColor,
                        altColor
                    );
                    break;
                default:
                    block.draw(
                        context,
                        footprint,
                        item.holes,
                        h,
                        mh,
                        wallColor,
                        altColor,
                        roofColor
                    );
            }

            switch (item.roofShape) {
                case "cone":
                    cylinder.draw(
                        context,
                        item.center,
                        item.radius,
                        0,
                        h + item.roofHeight,
                        h,
                        roofColor,
                        "" + Color.parse(roofColor).lightness(0.9)
                    );
                    break;
                case "dome":
                    cylinder.draw(
                        context,
                        item.center,
                        item.radius,
                        item.radius / 2,
                        h + item.roofHeight,
                        h,
                        roofColor,
                        "" + Color.parse(roofColor).lightness(0.9)
                    );
                    break;
                case "pyramid":
                    pyramid.draw(
                        context,
                        footprint,
                        item.center,
                        h + item.roofHeight,
                        h,
                        roofColor,
                        Color.parse(roofColor).lightness(0.9)
                    );
                    break;
            }
        }
    }
    setContext(context) {
        this.context = context;
    }
}

//****** file: Color.debug.js ******
class Color {
    constructor(h, s, l, a) {
        this.H = h;
        this.S = s;
        this.L = l;
        this.A = a;
    }

    hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    clamp(v, max) {
        return Math.min(max, Math.max(0, v));
    }

    /*
     * str can be in any of these:
     * #0099ff rgb(64, 128, 255) rgba(64, 128, 255, 0.5)
     */
    static parse(str) {
        var r = 0,
            g = 0,
            b = 0,
            a = 1,
            m;
        // Static variable
        var w3cColors = {
            aqua: "#00ffff",
            black: "#000000",
            blue: "#0000ff",
            fuchsia: "#ff00ff",
            gray: "#808080",
            grey: "#808080",
            green: "#008000",
            lime: "#00ff00",
            maroon: "#800000",
            navy: "#000080",
            olive: "#808000",
            orange: "#ffa500",
            purple: "#800080",
            red: "#ff0000",
            silver: "#c0c0c0",
            teal: "#008080",
            white: "#ffffff",
            yellow: "#ffff00"
        };

        str = ("" + str).toLowerCase();
        str = w3cColors[str] || str;

        if ((m = str.match(/^#(\w{2})(\w{2})(\w{2})$/))) {
            r = parseInt(m[1], 16);
            g = parseInt(m[2], 16);
            b = parseInt(m[3], 16);
        } else if (
            (m = str.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))
        ) {
            r = parseInt(m[1], 10);
            g = parseInt(m[2], 10);
            b = parseInt(m[3], 10);
            a = m[4] ? parseFloat(m[5]) : 1;
        } else {
            return;
        }

        return this.fromRGBA(r, g, b, a);
    }

    toRGBA() {
        var h = this.clamp(this.H, 360),
            s = this.clamp(this.S, 1),
            l = this.clamp(this.L, 1),
            rgba = {
                a: this.clamp(this.A, 1)
            };

        // achromatic
        if (s === 0) {
            rgba.r = l;
            rgba.g = l;
            rgba.b = l;
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s,
                p = 2 * l - q;
            h /= 360;

            rgba.r = this.hue2rgb(p, q, h + 1 / 3);
            rgba.g = this.hue2rgb(p, q, h);
            rgba.b = this.hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(rgba.r * 255),
            g: Math.round(rgba.g * 255),
            b: Math.round(rgba.b * 255),
            a: rgba.a
        };
    }

    static fromRGBA(r, g, b, a) {
        if (typeof r === "object") {
            g = r.g / 255;
            b = r.b / 255;
            a = r.a;
            r = r.r / 255;
        } else {
            r /= 255;
            g /= 255;
            b /= 255;
        }

        var max = Math.max(r, g, b),
            min = Math.min(r, g, b),
            h,
            s,
            l = (max + min) / 2,
            d = max - min;

        if (!d) {
            h = s = 0; // achromatic
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h *= 60;
        }

        return new Color(h, s, l, a);
    }

    toString() {
        var rgba = this.toRGBA();

        if (rgba.a === 1) {
            return (
                "#" +
                ((1 << 24) + (rgba.r << 16) + (rgba.g << 8) + rgba.b)
                .toString(16)
                .slice(1, 7)
            );
        }
        return (
            "rgba(" + [rgba.r, rgba.g, rgba.b, rgba.a.toFixed(2)].join(",") + ")"
        );
    }

    hue(h) {
        return new Color(this.H * h, this.S, this.L, this.A);
    }

    saturation(s) {
        return new Color(this.H, this.S * s, this.L, this.A);
    }

    lightness(l) {
        return new Color(this.H, this.S, this.L * l, this.A);
    }

    alpha(a) {
        return new Color(this.H, this.S, this.L, this.A * a);
    }
}

//****** file: Cylinder.js ******
class Cylinder {
    constructor() {}
    draw(
        context,
        center,
        radius,
        topRadius,
        height,
        minHeight,
        color,
        altColor,
        roofColor
    ) {
        var c = {
                x: center.x - ORIGIN_X,
                y: center.y - ORIGIN_Y
            },
            scale = CAM_Z / (CAM_Z - height),
            minScale = CAM_Z / (CAM_Z - minHeight),
            apex = buildings.project(c, scale),
            a1,
            a2;

        topRadius *= scale;

        if (minHeight) {
            c = buildings.project(c, minScale);
            radius = radius * minScale;
        }

        // common tangents for ground and roof circle
        var tangents = this._tangents(c, radius, apex, topRadius);

        // no tangents? top circle is inside bottom circle
        if (!tangents) {
            a1 = 1.5 * PI;
            a2 = 1.5 * PI;
        } else {
            a1 = atan2(tangents[0].y1 - c.y, tangents[0].x1 - c.x);
            a2 = atan2(tangents[1].y1 - c.y, tangents[1].x1 - c.x);
        }

        context.fillStyle = color;
        context.beginPath();
        context.arc(apex.x, apex.y, topRadius, HALF_PI, a1, true);
        context.arc(c.x, c.y, radius, a1, HALF_PI);
        context.closePath();
        context.fill();

        context.fillStyle = altColor;
        context.beginPath();
        context.arc(apex.x, apex.y, topRadius, a2, HALF_PI, true);
        context.arc(c.x, c.y, radius, HALF_PI, a2);
        context.closePath();
        context.fill();

        context.fillStyle = roofColor;
        this._circle(context, apex, topRadius);
    }

    simplified(context, center, radius) {
        this._circle(
            context, {
                x: center.x - ORIGIN_X,
                y: center.y - ORIGIN_Y
            },
            radius
        );
    }

    shadow(context, center, radius, topRadius, height, minHeight) {
        var c = {
                x: center.x - ORIGIN_X,
                y: center.y - ORIGIN_Y
            },
            apex = shadows.project(c, height),
            p1,
            p2;

        if (minHeight) {
            c = shadows.project(c, minHeight);
        }

        // common tangents for ground and roof circle
        var tangents = this._tangents(c, radius, apex, topRadius);

        // TODO: no tangents? roof overlaps everything near cam position
        if (tangents) {
            p1 = atan2(tangents[0].y1 - c.y, tangents[0].x1 - c.x);
            p2 = atan2(tangents[1].y1 - c.y, tangents[1].x1 - c.x);
            context.moveTo(tangents[1].x2, tangents[1].y2);
            context.arc(apex.x, apex.y, topRadius, p2, p1);
            context.arc(c.x, c.y, radius, p1, p2);
        } else {
            context.moveTo(c.x + radius, c.y);
            context.arc(c.x, c.y, radius, 0, 2 * PI);
        }
    }

    shadowMask(context, center, radius) {
        var c = {
            x: center.x - ORIGIN_X,
            y: center.y - ORIGIN_Y
        };
        context.moveTo(c.x + radius, c.y);
        context.arc(c.x, c.y, radius, 0, PI * 2);
    }

    hitArea(context, center, radius, topRadius, height, minHeight, color) {
        var c = {
                x: center.x - ORIGIN_X,
                y: center.y - ORIGIN_Y
            },
            scale = CAM_Z / (CAM_Z - height),
            minScale = CAM_Z / (CAM_Z - minHeight),
            apex = buildings.project(c, scale),
            p1,
            p2;

        topRadius *= scale;

        if (minHeight) {
            c = buildings.project(c, minScale);
            radius = radius * minScale;
        }

        // common tangents for ground and roof circle
        var tangents = this._tangents(c, radius, apex, topRadius);

        context.fillStyle = color;
        context.beginPath();

        // TODO: no tangents? roof overlaps everything near cam position
        if (tangents) {
            p1 = atan2(tangents[0].y1 - c.y, tangents[0].x1 - c.x);
            p2 = atan2(tangents[1].y1 - c.y, tangents[1].x1 - c.x);
            context.moveTo(tangents[1].x2, tangents[1].y2);
            context.arc(apex.x, apex.y, topRadius, p2, p1);
            context.arc(c.x, c.y, radius, p1, p2);
        } else {
            context.moveTo(c.x + radius, c.y);
            context.arc(c.x, c.y, radius, 0, 2 * PI);
        }

        context.closePath();
        context.fill();
    }

    _circle(context, center, radius) {
        context.beginPath();
        context.arc(center.x, center.y, radius, 0, PI * 2);
        context.stroke();
        context.fill();
    }

    // http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
    _tangents(c1, r1, c2, r2) {
        var dx = c1.x - c2.x,
            dy = c1.y - c2.y,
            dr = r1 - r2,
            sqdist = dx * dx + dy * dy;

        if (sqdist <= dr * dr) {
            return;
        }

        var dist = sqrt(sqdist),
            vx = -dx / dist,
            vy = -dy / dist,
            c = dr / dist,
            res = [],
            h,
            nx,
            ny;

        // Let A, B be the centers, and C, D be points at which the tangent
        // touches first and second circle, and n be the normal vector to it.
        //
        // We have the system:
        //   n * n = 1    (n is a unit vector)
        //   C = A + r1 * n
        //   D = B + r2 * n
        //   n * CD = 0   (common orthogonality)
        //
        // n * CD = n * (AB + r2*n - r1*n) = AB*n - (r1 -/+ r2) = 0,  <=>
        // AB * n = (r1 -/+ r2), <=>
        // v * n = (r1 -/+ r2) / d,  where v = AB/|AB| = AB/d
        // This is a linear equation in unknown vector n.
        // Now we're just intersecting a line with a circle: v*n=c, n*n=1

        h = sqrt(max(0, 1 - c * c));
        for (var sign = 1; sign >= -1; sign -= 2) {
            nx = vx * c - sign * h * vy;
            ny = vy * c + sign * h * vx;
            res.push({
                x1: (c1.x + r1 * nx) << 0,
                y1: (c1.y + r1 * ny) << 0,
                x2: (c2.x + r2 * nx) << 0,
                y2: (c2.y + r2 * ny) << 0
            });
        }

        return res;
    }
}

//****** file: Data.js ******
class Data {
    constructor() {
		this.geoJSON = new GeoJSON();
        shadows.setData(this);
        simplified.setData(this);
        buildings.setData(this);
        hitAreas.setData(this);
        this.DATA_SRC =
            "https://{s}.data.osmbuildings.org/0.2/{k}/tile/{z}/{x}/{y}.json";
        this.animTimer;
        // Static variables
        this.loadedItems = {}; // maintain a list of cached items in order to avoid duplicates on tile borders
        this.items = [];
        this.request = new Request();

    }

    getPixelFootprint(buffer) {
        var footprint = new Int32Array(buffer.length),
            px;

        for (var i = 0, il = buffer.length - 1; i < il; i += 2) {
            px = Functions.geoToPixel(buffer[i], buffer[i + 1]);
            footprint[i] = px.x;
            footprint[i + 1] = px.y;
        }

        footprint = Geometry.simplifyPolygon(footprint);
        if (footprint.length < 8) {
            // 3 points & end==start (*2)
            return;
        }

        return footprint;
    }

    getItems() {
        return this.items;
    }

    resetItems() {
        this.items = [];
        this.loadedItems = {};
        hitAreas.reset();
    }

    fadeIn() {
        if (this.animTimer) {
            return;
        }

        var scope = this;
        this.animTimer = setInterval(function() {
            var dataItems = scope.items;
            var isNeeded = false;

            for (var i = 0, il = dataItems.length; i < il; i++) {
                if (dataItems[i].scale < 1) {
                    dataItems[i].scale += 0.5 * 0.2; // amount*easing
                    if (dataItems[i].scale > 1) {
                        dataItems[i].scale = 1;
                    }
                    isNeeded = true;
                }
            }

            requestAnimFrame(function() {
                shadows.render();
                simplified.render();
                hitAreas.render();
                buildings.render();
            });

            if (!isNeeded) {
                clearInterval(this.animTimer);
                this.animTimer = null;
            }
        }, 33);
    }

    addRenderItems(data, allAreNew) {
        var item, scaledItem, id;

        var geojson = this.geoJSON.read(data);

        for (var i = 0, il = geojson.length; i < il; i++) {
            item = geojson[i];
            id =
                item.id || [
                    item.footprint[0],
                    item.footprint[1],
                    item.height,
                    item.minHeight
                ].join(",");
            if (!this.loadedItems[id]) {
                if ((scaledItem = this.scale(item))) {
                    scaledItem.scale = allAreNew ? 0 : 1;
                    this.items.push(scaledItem);
                    this.loadedItems[id] = 1;
                }
            }
        }
        this.fadeIn();
    }

    scale(item) {
        var res = {},
            // TODO: calculate this on zoom change only
            zoomScale = 6 / pow(2, ZOOM - MIN_ZOOM); // TODO: consider using HEIGHT / (global.devicePixelRatio || 1)

        if (item.id) {
            res.id = item.id;
        }

        res.height = min(item.height / zoomScale, MAX_HEIGHT);
		res.realHeight = item.height;

        res.minHeight = isNaN(item.minHeight) ? 0 : item.minHeight / zoomScale;
        if (res.minHeight > MAX_HEIGHT) {
            return;
        }

        res.footprint = this.getPixelFootprint(item.footprint);
        if (!res.footprint) {
            return;
        }
        res.center = Geometry.getCenter(res.footprint);

        if (item.radius) {
            res.radius = item.radius * PIXEL_PER_DEG;
        }
        if (item.shape) {
            res.shape = item.shape;
        }
        if (item.roofShape) {
            res.roofShape = item.roofShape;
        }
        if (
            (res.roofShape === "cone" || res.roofShape === "dome") &&
            !res.shape &&
            Geometry.isRotational(res.footprint)
        ) {
            res.shape = "cylinder";
        }

        if (item.holes) {
            res.holes = [];
            var innerFootprint;
            for (var i = 0, il = item.holes.length; i < il; i++) {
                // TODO: simplify
                if ((innerFootprint = this.getPixelFootprint(item.holes[i]))) {
                    res.holes.push(innerFootprint);
                }
            }
        }

        var color;

        if (item.wallColor) {
            if ((color = Color.parse(item.wallColor))) {
                color = color.alpha(ZOOM_FACTOR);
                res.altColor = "" + color.lightness(0.8);
                res.wallColor = "" + color;
            }
        }

        if (item.roofColor) {
            if ((color = Color.parse(item.roofColor))) {
                res.roofColor = "" + color.alpha(ZOOM_FACTOR);
            }
        }

        if (item.relationId) {
            res.relationId = item.relationId;
        }
        res.hitColor = hitAreas.idToColor(item.relationId || item.id);

        res.roofHeight = isNaN(item.roofHeight) ? 0 : item.roofHeight / zoomScale;

        if (res.height + res.roofHeight <= res.minHeight) {
            return;
        }

        return res;
    }

    set(data) {
		// Make sure valid json
		try
        {
            JSON.parse(data);
        }
        catch (e)
        { 
            return;
        }
        this.isStatic = true;
        this.resetItems();
        this._staticData = data;
        this.addRenderItems(this._staticData, true);
    }

    load(src, key) {
        this.src = src || this.DATA_SRC.replace("{k}", key || "anonymous");
        this.update();
    }

    update() {
        this.resetItems();

        if (ZOOM < MIN_ZOOM) {
            return;
        }

        if (this.isStatic && this._staticData) {
            this.addRenderItems(this._staticData);
            return;
        }

        if (!this.src) {
            return;
        }

        var tileZoom = 16,
            tileSize = 256,
            zoomedTileSize =
            ZOOM > tileZoom ?
            tileSize << (ZOOM - tileZoom) :
            tileSize >> (tileZoom - ZOOM),
            minX = (ORIGIN_X / zoomedTileSize) << 0,
            minY = (ORIGIN_Y / zoomedTileSize) << 0,
            maxX = ceil((ORIGIN_X + WIDTH) / zoomedTileSize),
            maxY = ceil((ORIGIN_Y + HEIGHT) / zoomedTileSize),
            x,
            y;

        var scope = this;

        function callback(json) {
            scope.addRenderItems(json);
        }

        for (y = minY; y <= maxY; y++) {
            for (x = minX; x <= maxX; x++) {
                this.loadTile(x, y, tileZoom, callback);
            }
        }
    }

    loadTile(x, y, zoom, callback) {
        var s = "abcd" [(x + y) % 4];
        var url = this.src
            .replace("{s}", s)
            .replace("{x}", x)
            .replace("{y}", y)
            .replace("{z}", zoom);
        return this.request.loadJSON(url, callback);
    }
}

//****** file: Debug.js ******
class Debug {
    constructor() {}

    point(x, y, color, size) {
        var context = this.context;
        context.fillStyle = color || "#ffcc00";
        context.beginPath();
        context.arc(x, y, size || 3, 0, 2 * PI);
        context.closePath();
        context.fill();
    }

    line(ax, ay, bx, by, color) {
        var context = this.context;
        context.strokeStyle = color || "#ffcc00";
        context.beginPath();
        context.moveTo(ax, ay);
        context.lineTo(bx, by);
        context.closePath();
        context.stroke();
    }
}

//****** file: functions.js ******
class Functions {
    static rad(deg) {
        return (deg * PI) / 180;
    }

    static deg(rad) {
        return (rad / PI) * 180;
    }

    static pixelToGeo(x, y) {
        var res = {};
        x /= MAP_SIZE;
        y /= MAP_SIZE;
        res[LAT] =
            y <= 0 ?
            90 :
            y >= 1 ?
            -90 :
            Functions.deg(2 * atan(exp(PI * (1 - 2 * y))) - HALF_PI);
        res[LON] = (x === 1 ? 1 : ((x % 1) + 1) % 1) * 360 - 180;
        return res;
    }

    static geoToPixel(lat, lon) {
        var latitude = min(
                1,
                max(0, 0.5 - log(tan(QUARTER_PI + (HALF_PI * lat) / 180)) / PI / 2)
            ),
            longitude = lon / 360 + 0.5;
        return {
            x: (longitude * MAP_SIZE) << 0,
            y: (latitude * MAP_SIZE) << 0
        };
    }

    static fromRange(sVal, sMin, sMax, dMin, dMax) {
        sVal = min(max(sVal, sMin), sMax);
        var rel = (sVal - sMin) / (sMax - sMin),
            range = dMax - dMin;
        return min(max(dMin + rel * range, dMin), dMax);
    }

    static isVisible(polygon) {
        var maxX = WIDTH + ORIGIN_X,
            maxY = HEIGHT + ORIGIN_Y;

        // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
        for (var i = 0, il = polygon.length - 3; i < il; i += 2) {
            if (
                polygon[i] > ORIGIN_X &&
                polygon[i] < maxX &&
                polygon[i + 1] > ORIGIN_Y &&
                polygon[i + 1] < maxY
            ) {
                return true;
            }
        }
        return false;
    }
}

//****** file: GeoJSON.js ******
class GeoJSON {
    constructor() {
        this.METERS_PER_LEVEL = 3;

        this.materialColors = {
            brick: "#cc7755",
            bronze: "#ffeecc",
            canvas: "#fff8f0",
            concrete: "#999999",
            copper: "#a0e0d0",
            glass: "#e8f8f8",
            gold: "#ffcc00",
            plants: "#009933",
            metal: "#aaaaaa",
            panel: "#fff8f0",
            plaster: "#999999",
            roof_tiles: "#f08060",
            silver: "#cccccc",
            slate: "#666666",
            stone: "#996666",
            tar_paper: "#333333",
            wood: "#deb887"
        };

        this.baseMaterials = {
            asphalt: "tar_paper",
            bitumen: "tar_paper",
            block: "stone",
            bricks: "brick",
            glas: "glass",
            glassfront: "glass",
            grass: "plants",
            masonry: "stone",
            granite: "stone",
            panels: "panel",
            paving_stones: "stone",
            plastered: "plaster",
            rooftiles: "roof_tiles",
            roofingfelt: "tar_paper",
            sandstone: "stone",
            sheet: "canvas",
            sheets: "canvas",
            shingle: "tar_paper",
            shingles: "tar_paper",
            slates: "slate",
            steel: "metal",
            tar: "tar_paper",
            tent: "canvas",
            thatch: "plants",
            tile: "roof_tiles",
            tiles: "roof_tiles"
        };

        this.WINDING_CLOCKWISE = "CW";
        this.WINDING_COUNTER_CLOCKWISE = "CCW";
        // cardboard
        // eternit
        // limestone
        // straw
    }

    getMaterialColor(str) {
        str = str.toLowerCase();
        if (str[0] === "#") {
            return str;
        }
        return this.materialColors[this.baseMaterials[str] || str] || null;
    }

    // detect winding direction: clockwise or counter clockwise
    getWinding(points) {
        var x1,
            y1,
            x2,
            y2,
            a = 0,
            i,
            il;
        for (i = 0, il = points.length - 3; i < il; i += 2) {
            x1 = points[i];
            y1 = points[i + 1];
            x2 = points[i + 2];
            y2 = points[i + 3];
            a += x1 * y2 - x2 * y1;
        }
        return a / 2 > 0 ? this.WINDING_CLOCKWISE : this.WINDING_COUNTER_CLOCKWISE;
    }

    // enforce a polygon winding direcetion. Needed for proper backface culling.
    makeWinding(points, direction) {
        var winding = this.getWinding(points);
        if (winding === direction) {
            return points;
        }
        var revPoints = [];
        for (var i = points.length - 2; i >= 0; i -= 2) {
            revPoints.push(points[i], points[i + 1]);
        }
        return revPoints;
    }

    alignProperties(prop) {
        var item = {};

        prop = prop || {};

        item.height =
            prop.height ||
            (prop.levels ? prop.levels * this.METERS_PER_LEVEL : DEFAULT_HEIGHT);
        item.minHeight =
            prop.minHeight || (prop.minLevel ? prop.minLevel * this.METERS_PER_LEVEL : 0);

        var wallColor = prop.material ?
            this.getMaterialColor(prop.material) :
            prop.wallColor || prop.color;
        if (wallColor) {
            item.wallColor = wallColor;
        }

        var roofColor = prop.roofMaterial ?
            this.getMaterialColor(prop.roofMaterial) :
            prop.roofColor;
        if (roofColor) {
            item.roofColor = roofColor;
        }

        switch (prop.shape) {
            case "cylinder":
            case "cone":
            case "dome":
            case "sphere":
                item.shape = prop.shape;
                item.isRotational = true;
                break;

            case "pyramid":
                item.shape = prop.shape;
                break;
        }

        switch (prop.roofShape) {
            case "cone":
            case "dome":
                item.roofShape = prop.roofShape;
                item.isRotational = true;
                break;

            case "pyramid":
                item.roofShape = prop.roofShape;
                break;
        }

        if (item.roofShape && prop.roofHeight) {
            item.roofHeight = prop.roofHeight;
            item.height = max(0, item.height - item.roofHeight);
        } else {
            item.roofHeight = 0;
        }

        return item;
    }

    getGeometries(geometry) {
        var i,
            il,
            polygon,
            geometries = [],
            sub;

        switch (geometry.type) {
            case "GeometryCollection":
                geometries = [];
                for (i = 0, il = geometry.geometries.length; i < il; i++) {
                    if ((sub = getGeometries(geometry.geometries[i]))) {
                        geometries.push.apply(geometries, sub);
                    }
                }
                return geometries;

            case "MultiPolygon":
                geometries = [];
                for (i = 0, il = geometry.coordinates.length; i < il; i++) {
                    if (
                        (sub = getGeometries({
                            type: "Polygon",
                            coordinates: geometry.coordinates[i]
                        }))
                    ) {
                        geometries.push.apply(geometries, sub);
                    }
                }
                return geometries;

            case "Polygon":
                polygon = geometry.coordinates;
                break;

            default:
                return [];
        }

        var j,
            jl,
            p,
            lat = 1,
            lon = 0,
            outer = [],
            inner = [];

        p = polygon[0];
        for (i = 0, il = p.length; i < il; i++) {
            outer.push(p[i][lat], p[i][lon]);
        }
        outer = this.makeWinding(outer, this.WINDING_CLOCKWISE);

        for (i = 0, il = polygon.length - 1; i < il; i++) {
            p = polygon[i + 1];
            inner[i] = [];
            for (j = 0, jl = p.length; j < jl; j++) {
                inner[i].push(p[j][lat], p[j][lon]);
            }
            inner[i] = this.makeWinding(inner[i], this.WINDING_COUNTER_CLOCKWISE);
        }

        return [{
            outer: outer,
            inner: inner.length ? inner : null
        }];
    }

    clone(obj) {
        var res = {};
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                res[p] = obj[p];
            }
        }
        return res;
    }

    read(geojson) {
        if (!geojson || geojson.type !== "FeatureCollection") {
            return [];
        }

        var collection = geojson.features,
            i,
            il,
            j,
            jl,
            res = [],
            feature,
            geometries,
            baseItem,
            item;

        for (i = 0, il = collection.length; i < il; i++) {
            feature = collection[i];

            // TODO review this commented out code
            if (feature.type !== "Feature") { // || onEach(feature) === false) {
                continue;
            }

            baseItem = this.alignProperties(feature.properties);
            geometries = this.getGeometries(feature.geometry);

            for (j = 0, jl = geometries.length; j < jl; j++) {
                item = this.clone(baseItem);
                item.footprint = geometries[j].outer;
                if (item.isRotational) {
                    item.radius = Geometry.getLonDelta(item.footprint);
                }

                if (geometries[j].inner) {
                    item.holes = geometries[j].inner;
                }
                if (feature.id || feature.properties.id) {
                    item.id = feature.id || feature.properties.id;
                }

                if (feature.properties.relationId) {
                    item.relationId = feature.properties.relationId;
                }

                res.push(item); // TODO: clone base properties!
            }
        }

        return res;
    }
}

//****** file: geometry.js ******
class Geometry {
    static getDistance(p1, p2) {
        var dx = p1.x - p2.x,
            dy = p1.y - p2.y;
        return dx * dx + dy * dy;
    }

    static isRotational(polygon) {
        var length = polygon.length;
        if (length < 16) {
            return false;
        }

        var i;

        var minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
        for (i = 0; i < length - 1; i += 2) {
            minX = Math.min(minX, polygon[i]);
            maxX = Math.max(maxX, polygon[i]);
            minY = Math.min(minY, polygon[i + 1]);
            maxY = Math.max(maxY, polygon[i + 1]);
        }

        var width = maxX - minX,
            height = maxY - minY,
            ratio = width / height;

        if (ratio < 0.85 || ratio > 1.15) {
            return false;
        }

        var center = {
                x: minX + width / 2,
                y: minY + height / 2
            },
            radius = (width + height) / 4,
            sqRadius = radius * radius;

        for (i = 0; i < length - 1; i += 2) {
            var dist = Geometry.getDistance({
                x: polygon[i],
                y: polygon[i + 1]
            }, center);
            if (dist / sqRadius < 0.8 || dist / sqRadius > 1.2) {
                return false;
            }
        }

        return true;
    }

    static getSquareSegmentDistance(px, py, p1x, p1y, p2x, p2y) {
        var dx = p2x - p1x,
            dy = p2y - p1y,
            t;
        if (dx !== 0 || dy !== 0) {
            t = ((px - p1x) * dx + (py - p1y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                p1x = p2x;
                p1y = p2y;
            } else if (t > 0) {
                p1x += dx * t;
                p1y += dy * t;
            }
        }
        dx = px - p1x;
        dy = py - p1y;
        return dx * dx + dy * dy;
    }

    static simplifyPolygon(buffer) {
        var sqTolerance = 2,
            len = buffer.length / 2,
            markers = new Uint8Array(len),
            first = 0,
            last = len - 1,
            i,
            maxSqDist,
            sqDist,
            index,
            firstStack = [],
            lastStack = [],
            newBuffer = [];

        markers[first] = markers[last] = 1;

        while (last) {
            maxSqDist = 0;
            for (i = first + 1; i < last; i++) {
                sqDist = Geometry.getSquareSegmentDistance(
                    buffer[i * 2],
                    buffer[i * 2 + 1],
                    buffer[first * 2],
                    buffer[first * 2 + 1],
                    buffer[last * 2],
                    buffer[last * 2 + 1]
                );
                if (sqDist > maxSqDist) {
                    index = i;
                    maxSqDist = sqDist;
                }
            }

            if (maxSqDist > sqTolerance) {
                markers[index] = 1;

                firstStack.push(first);
                lastStack.push(index);

                firstStack.push(index);
                lastStack.push(last);
            }

            first = firstStack.pop();
            last = lastStack.pop();
        }

        for (i = 0; i < len; i++) {
            if (markers[i]) {
                newBuffer.push(buffer[i * 2], buffer[i * 2 + 1]);
            }
        }

        return newBuffer;
    }

    static getCenter(footprint) {
        var minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
        for (var i = 0, il = footprint.length - 3; i < il; i += 2) {
            minX = min(minX, footprint[i]);
            maxX = max(maxX, footprint[i]);
            minY = min(minY, footprint[i + 1]);
            maxY = max(maxY, footprint[i + 1]);
        }
        return {
            x: (minX + (maxX - minX) / 2) << 0,
            y: (minY + (maxY - minY) / 2) << 0
        };
    }

    static getLonDelta(footprint) {
        var minLon = 180,
            maxLon = -180;
        for (var i = 0, il = footprint.length; i < il; i += 2) {
            minLon = min(minLon, footprint[i + 1]);
            maxLon = max(maxLon, footprint[i + 1]);
        }
        return (maxLon - minLon) / 2;
    }
}

//****** file: HitAreas.js ******
class HitAreas {

    constructor() {
        this.data;

        this._idMapping = [null];
    }

    setData(data) {
        this.data = data;
    }

    reset() {
        this._idMapping = [null];
    }

    render() {
        if (this._timer) {
            return;
        }
        var self = this;
        this._timer = setTimeout(function() {
            self._timer = null;
            self._render();
        }, 500);
    }

    _render() {
        var context = this.context;

        context.clearRect(0, 0, WIDTH, HEIGHT);

        // show on high zoom levels only and avoid rendering during zoom
        if (ZOOM < MIN_ZOOM || isZooming) {
            return;
        }

        var item,
            h,
            mh,
            sortCam = {
                x: CAM_X + ORIGIN_X,
                y: CAM_Y + ORIGIN_Y
            },
            footprint,
            color,
            dataItems = this.data.getItems();

        dataItems.sort(function(a, b) {
            return (
                a.minHeight - b.minHeight ||
                Geometry.getDistance(b.center, sortCam) - Geometry.getDistance(a.center, sortCam) ||
                b.height - a.height
            );
        });

        var cylinder = new Cylinder();
        var pyramid = new Pyramid();
        var block = new Block();
        for (var i = 0, il = dataItems.length; i < il; i++) {
            item = dataItems[i];

            if (!(color = item.hitColor)) {
                continue;
            }

            footprint = item.footprint;

            if (!Functions.isVisible(footprint)) {
                continue;
            }

            h = item.height;

            mh = 0;
            if (item.minHeight) {
                mh = item.minHeight;
            }

            switch (item.shape) {
                case "cylinder":
                    cylinder.hitArea(
                        context,
                        item.center,
                        item.radius,
                        item.radius,
                        h,
                        mh,
                        color
                    );
                    break;
                case "cone":
                    cylinder.hitArea(context, item.center, item.radius, 0, h, mh, color);
                    break;
                case "dome":
                    cylinder.hitArea(
                        context,
                        item.center,
                        item.radius,
                        item.radius / 2,
                        h,
                        mh,
                        color
                    );
                    break;
                case "sphere":
                    cylinder.hitArea(
                        context,
                        item.center,
                        item.radius,
                        item.radius,
                        h,
                        mh,
                        color
                    );
                    break;
                case "pyramid":
                    pyramid.hitArea(context, footprint, item.center, h, mh, color);
                    break;
                default:
                    block.hitArea(context, footprint, item.holes, h, mh, color);
            }

            switch (item.roofShape) {
                case "cone":
                    cylinder.hitArea(
                        context,
                        item.center,
                        item.radius,
                        0,
                        h + item.roofHeight,
                        h,
                        color
                    );
                    break;
                case "dome":
                    cylinder.hitArea(
                        context,
                        item.center,
                        item.radius,
                        item.radius / 2,
                        h + item.roofHeight,
                        h,
                        color
                    );
                    break;
                case "pyramid":
                    pyramid.hitArea(
                        context,
                        footprint,
                        item.center,
                        h + item.roofHeight,
                        h,
                        color
                    );
                    break;
            }
        }

        // otherwise fails on size 0
        if (WIDTH && HEIGHT) {
            this._imageData = this.context.getImageData(0, 0, WIDTH, HEIGHT).data;
        }
    }

    getIdFromXY(x, y) {
        var imageData = this._imageData;
        if (!imageData) {
            return;
        }
        var pos = 4 * ((y | 0) * WIDTH + (x | 0));
        var index =
            imageData[pos] | (imageData[pos + 1] << 8) | (imageData[pos + 2] << 16);
        return this._idMapping[index];
    }

    idToColor(id) {
        var index = this._idMapping.indexOf(id);
        if (index === -1) {
            this._idMapping.push(id);
            index = this._idMapping.length - 1;
        }
        var r = index & 0xff;
        var g = (index >> 8) & 0xff;
        var b = (index >> 16) & 0xff;
        return "rgb(" + [r, g, b].join(",") + ")";
    }

    setContext(context) {
        this.context = context;
    }
}

//****** file: Layers.js ******
class Layers {
    constructor() {

        this.container = document.createElement("DIV");
        this.items = [];
        this.container.style.pointerEvents = "none";
        this.container.style.position = "absolute";
        this.container.style.left = 0;
        this.container.style.top = 0;


        // TODO: improve this to .setContext(context)
        shadows.setContext(this.createContext(this.container));
        simplified.setContext(this.createContext(this.container));
        buildings.setContext(this.createContext(this.container));
        hitAreas.setContext(this.createContext());
        //    Debug.context      = this.createContext(this.container);
    }

    render(quick) {

        requestAnimFrame(function() {
            if (!quick) {
                shadows.render();
                simplified.render();
                hitAreas.render();
            }
            buildings.render();
        });
    }

    createContext(container) {
        var canvas = document.createElement("CANVAS");
        canvas.style.transform = "translate3d(0, 0, 0)"; // turn on hw acceleration
        canvas.style.imageRendering = "optimizeSpeed";
        canvas.style.position = "absolute";
        canvas.style.left = 0;
        canvas.style.top = 0;

        var context = canvas.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = 1;
        context.imageSmoothingEnabled = false;

        this.items.push(canvas);
        if (container) {
            container.appendChild(canvas);
        }

        return context;
    }

    appendTo(parentNode) {
        parentNode.appendChild(this.container);
    }

    remove() {
        this.container.parentNode.removeChild(this.container);
    }

    setSize(width, height) {
        for (var i = 0, il = this.items.length; i < il; i++) {
            this.items[i].width = width;
            this.items[i].height = height;
        }
    }

    // usually called after move: container jumps by move delta, cam is reset
    setPosition(x, y) {
        this.container.style.left = x + "px";
        this.container.style.top = y + "px";
    }
}

//****** file: Pyramid.js ******
class Pyramid {
    constructor() {}

    draw(context, polygon, center, height, minHeight, color, altColor) {
        var c = {
                x: center.x - ORIGIN_X,
                y: center.y - ORIGIN_Y
            },
            scale = CAM_Z / (CAM_Z - height),
            minScale = CAM_Z / (CAM_Z - minHeight),
            apex = buildings.project(c, scale),
            a = {
                x: 0,
                y: 0
            },
            b = {
                x: 0,
                y: 0
            };

        for (var i = 0, il = polygon.length - 3; i < il; i += 2) {
            a.x = polygon[i] - ORIGIN_X;
            a.y = polygon[i + 1] - ORIGIN_Y;
            b.x = polygon[i + 2] - ORIGIN_X;
            b.y = polygon[i + 3] - ORIGIN_Y;

            if (minHeight) {
                a = buildings.project(a, minScale);
                b = buildings.project(b, minScale);
            }

            // backface culling check
            if ((b.x - a.x) * (apex.y - a.y) > (apex.x - a.x) * (b.y - a.y)) {
                // depending on direction, set shading
                if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
                    context.fillStyle = altColor;
                } else {
                    context.fillStyle = color;
                }

                context.beginPath();
                this._triangle(context, a, b, apex);
                context.closePath();
                context.fill();
            }
        }
    }

    _triangle(context, a, b, c) {
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.lineTo(c.x, c.y);
    }

    _ring(context, polygon) {
        context.moveTo(polygon[0] - ORIGIN_X, polygon[1] - ORIGIN_Y);
        for (var i = 2, il = polygon.length - 1; i < il; i += 2) {
            context.lineTo(polygon[i] - ORIGIN_X, polygon[i + 1] - ORIGIN_Y);
        }
    }

    shadow(context, polygon, center, height, minHeight) {
        var a = {
                x: 0,
                y: 0
            },
            b = {
                x: 0,
                y: 0
            },
            c = {
                x: center.x - ORIGIN_X,
                y: center.y - ORIGIN_Y
            },
            apex = shadows.project(c, height);

        for (var i = 0, il = polygon.length - 3; i < il; i += 2) {
            a.x = polygon[i] - ORIGIN_X;
            a.y = polygon[i + 1] - ORIGIN_Y;
            b.x = polygon[i + 2] - ORIGIN_X;
            b.y = polygon[i + 3] - ORIGIN_Y;

            if (minHeight) {
                a = shadows.project(a, minHeight);
                b = shadows.project(b, minHeight);
            }

            // backface culling check
            if ((b.x - a.x) * (apex.y - a.y) > (apex.x - a.x) * (b.y - a.y)) {
                // depending on direction, set shading
                this._triangle(context, a, b, apex);
            }
        }
    }

    shadowMask(context, polygon) {
        _ring(context, polygon);
    }

    hitArea(context, polygon, center, height, minHeight, color) {
        var c = {
                x: center.x - ORIGIN_X,
                y: center.y - ORIGIN_Y
            },
            scale = CAM_Z / (CAM_Z - height),
            minScale = CAM_Z / (CAM_Z - minHeight),
            apex = buildings.project(c, scale),
            a = {
                x: 0,
                y: 0
            },
            b = {
                x: 0,
                y: 0
            };

        context.fillStyle = color;
        context.beginPath();

        for (var i = 0, il = polygon.length - 3; i < il; i += 2) {
            a.x = polygon[i] - ORIGIN_X;
            a.y = polygon[i + 1] - ORIGIN_Y;
            b.x = polygon[i + 2] - ORIGIN_X;
            b.y = polygon[i + 3] - ORIGIN_Y;

            if (minHeight) {
                a = buildings.project(a, minScale);
                b = buildings.project(b, minScale);
            }

            // backface culling check
            if ((b.x - a.x) * (apex.y - a.y) > (apex.x - a.x) * (b.y - a.y)) {
                this._triangle(context, a, b, apex);
            }
        }

        context.closePath();
        context.fill();
    }
}

//****** file: Request.js ******
class Request {
    constructor() {
        this.cacheData = {};
        this.cacheIndex = [];
        this.cacheSize = 0;
        this.maxCacheSize = 1024 * 1024 * 5; // 5MB
    }

    xhr(url, callback) {

        if (this.cacheData[url]) {
            if (callback) {
                callback(this.cacheData[url]);
            }
            return;
        }

        var req = new XMLHttpRequest();
        var scope = this;
        req.onreadystatechange = function() {

            if (req.readyState !== 4) {
                return;
            }
            if (!req.status || req.status < 200 || req.status > 299) {
                return;
            }
            if (callback && req.responseText) {
                var responseText = req.responseText;
                scope.cacheData[url] = responseText;
                scope.cacheIndex.push({
                    url: url,
                    size: responseText.length
                });
                scope.cacheSize += responseText.length;

                callback(responseText);

                while (scope.cacheSize > scope.maxCacheSize) {
                    var item = scope.cacheIndex.shift();
                    scope.cacheSize -= item.size;
                    delete scope.cacheData[item.url];
                }
            }
        };

        req.open("GET", url);
        req.send(null);

        return req;
    }

    loadJSON(url, callback) {
        return this.xhr(url, function(responseText) {
            var json;
            try {
                json = JSON.parse(responseText);
            } catch (ex) {}
            callback(json);
        });
    }
}

//****** file: Shadows.js ******
class Shadows {
    constructor() {
		this.sunPosition = new SunPosition();
        this.enabled = true;
        this.color = "#666666";
        this.blurColor = "#000000";
        this.blurSize = 15;
        this.date = new Date();
        this.direction = {
            x: 0,
            y: 0
        };
        this.context;
        this.data;
    }

    project(p, h) {
        return {
            x: p.x + this.direction.x * h,
            y: p.y + this.direction.y * h
        };
    }

    setData(data) {
        this.data = data;
    }

    render() {
        var context = this.context,
            screenCenter,
            sun,
            length,
            alpha;

        context.clearRect(0, 0, WIDTH, HEIGHT);

        // show on high zoom levels only and avoid rendering during zoom
        if (!this.enabled || ZOOM < MIN_ZOOM || isZooming) {
            return;
        }

        // TODO: calculate this just on demand
        screenCenter = Functions.pixelToGeo(
            CENTER_X + ORIGIN_X,
            CENTER_Y + ORIGIN_Y
        );
        sun = this.sunPosition.getSunPosition(
            this.date,
            screenCenter.latitude,
            screenCenter.longitude
        );

        if (sun.altitude <= 0) {
            return;
        }

        length = 1 / tan(sun.altitude);
        alpha = length < 5 ? 0.75 : (1 / length) * 5;

        this.direction.x = cos(sun.azimuth) * length;
        this.direction.y = sin(sun.azimuth) * length;

        var i,
            il,
            item,
            h,
            mh,
            footprint,
            dataItems = this.data.getItems();

        context.canvas.style.opacity = alpha / (ZOOM_FACTOR * 2);
        context.shadowColor = this.blurColor;
        context.shadowBlur = this.blurSize * (ZOOM_FACTOR / 2);
        context.fillStyle = this.color;
        context.beginPath();

        var cylinder = new Cylinder();
        var pyramid = new Pyramid();
        var block = new Block();
        for (i = 0, il = dataItems.length; i < il; i++) {
            item = dataItems[i];

            footprint = item.footprint;

            if (!Functions.isVisible(footprint)) {
                continue;
            }

            // when fading in, use a dynamic height
            h = item.scale < 1 ? item.height * item.scale : item.height;

            mh = 0;
            if (item.minHeight) {
                mh = item.scale < 1 ? item.minHeight * item.scale : item.minHeight;
            }

            switch (item.shape) {
                case "cylinder":
                    cylinder.shadow(
                        context,
                        item.center,
                        item.radius,
                        item.radius,
                        h,
                        mh
                    );
                    break;
                case "cone":
                    cylinder.shadow(context, item.center, item.radius, 0, h, mh);
                    break;
                case "dome":
                    cylinder.shadow(
                        context,
                        item.center,
                        item.radius,
                        item.radius / 2,
                        h,
                        mh
                    );
                    break;
                case "sphere":
                    cylinder.shadow(
                        context,
                        item.center,
                        item.radius,
                        item.radius,
                        h,
                        mh
                    );
                    break;
                case "pyramid":
                    pyramid.shadow(context, footprint, item.center, h, mh);
                    break;
                default:
                    block.shadow(context, footprint, item.holes, h, mh);
            }

            switch (item.roofShape) {
                case "cone":
                    cylinder.shadow(
                        context,
                        item.center,
                        item.radius,
                        0,
                        h + item.roofHeight,
                        h
                    );
                    break;
                case "dome":
                    cylinder.shadow(
                        context,
                        item.center,
                        item.radius,
                        item.radius / 2,
                        h + item.roofHeight,
                        h
                    );
                    break;
                case "pyramid":
                    pyramid.shadow(
                        context,
                        footprint,
                        item.center,
                        h + item.roofHeight,
                        h
                    );
                    break;
            }
        }

        context.closePath();
        context.fill();

        context.shadowBlur = null;

        // now draw all the footprints as negative clipping mask
        context.globalCompositeOperation = "destination-out";
        context.beginPath();

        for (i = 0, il = dataItems.length; i < il; i++) {
            item = dataItems[i];

            footprint = item.footprint;

            if (!Functions.isVisible(footprint)) {
                continue;
            }

            // if object is hovered, there is no need to clip it's footprint
            if (item.minHeight) {
                continue;
            }

            switch (item.shape) {
                case "cylinder":
                case "cone":
                case "dome":
                    cylinder.shadowMask(context, item.center, item.radius);
                    break;
                default:
                    block.shadowMask(context, footprint, item.holes);
            }
        }

        context.fillStyle = "#00ff00";
        context.fill();
        context.globalCompositeOperation = "source-over";
    }

    setContext(context) {
        this.context = context;
    }
}

//****** file: Simplified.js ******
class Simplified {
    constructor() {
        this.data;
        this.init();
    }

    setData(data) {
        this.data = data;
    }

    init() {
        this.maxZoom = this.MIN_ZOOM + 2;
        this.maxHeight = 5;
    }

    isSimple(item) {
        return (
            ZOOM <= this.maxZoom && item.height + item.roofHeight < this.maxHeight
        );
    }

    render() {
        var context = this.context;
        context.clearRect(0, 0, WIDTH, HEIGHT);

        // show on high zoom levels only and avoid rendering during zoom
        if (ZOOM < MIN_ZOOM || isZooming || ZOOM > this.maxZoom) {
            return;
        }

        var item,
            footprint,
            dataItems = this.data.getItems();

        var cylinder = new Cylinder();
        var block = new Block();
        for (var i = 0, il = dataItems.length; i < il; i++) {
            item = dataItems[i];

            if (item.height >= this.maxHeight) {
                continue;
            }

            footprint = item.footprint;

            if (!Functions.isVisible(footprint)) {
                continue;
            }

            context.strokeStyle = item.altColor || ALT_COLOR_STR;
            context.fillStyle = item.roofColor || ROOF_COLOR_STR;

            switch (item.shape) {
                case "cylinder":
                case "cone":
                case "dome":
                case "sphere":
                    cylinder.simplified(context, item.center, item.radius);
                    break;
                default:
                    block.simplified(context, footprint, item.holes);
            }
        }
    }

    setContext(context) {
        this.context = context;
    }
}

//****** file: SunPosition.js ******

// calculations are based on http://aa.quae.nl/en/reken/zonpositie.html
// code credits to Vladimir Agafonkin (@mourner)
class SunPosition {
    constructor() {
        this.init();
    }

    init() {
        this.m = Math;
        (this.PI = m.PI), (this.sin = m.sin);
        this.cos = m.cos;
        this.tan = m.tan;
        this.asin = m.asin;
        this.atan = m.atan2;

        this.rad = PI / 180;
        this.dayMs = 1000 * 60 * 60 * 24;
        this.J1970 = 2440588;
        this.J2000 = 2451545;
        this.e = this.rad * 23.4397; // obliquity of the Earth
    }

    toJulian(date) {
        return date.valueOf() / this.dayMs - 0.5 + this.J1970;
    }
    toDays(date) {
        return this.toJulian(date) - this.J2000;
    }
    getRightAscension(l, b) {
        return this.atan(
            this.sin(l) * this.cos(this.e) - this.tan(b) * this.sin(this.e),
            this.cos(l)
        );
    }
    getDeclination(l, b) {
        return this.asin(
            this.sin(b) * this.cos(this.e) +
            this.cos(b) * this.sin(this.e) * this.sin(l)
        );
    }
    getAzimuth(H, phi, dec) {
        return this.atan(
            this.sin(H),
            this.cos(H) * this.sin(phi) - this.tan(dec) * this.cos(phi)
        );
    }
    getAltitude(H, phi, dec) {
        return this.asin(
            this.sin(phi) * this.sin(dec) +
            this.cos(phi) * this.cos(dec) * this.cos(H)
        );
    }
    getSiderealTime(d, lw) {
        return this.rad * (280.16 + 360.9856235 * d) - lw;
    }
    getSolarMeanAnomaly(d) {
        return this.rad * (357.5291 + 0.98560028 * d);
    }
    getEquationOfCenter(M) {
        return (
            this.rad *
            (1.9148 * this.sin(M) + 0.02 * this.sin(2 * M) + 0.0003 * this.sin(3 * M))
        );
    }
    getEclipticLongitude(M, C) {
        var P = this.rad * 102.9372; // perihelion of the Earth
        return M + C + P + this.PI;
    }

    getSunPosition(date, lat, lon) {
        var lw = this.rad * -lon,
            phi = this.rad * lat,
            d = this.toDays(date),
            M = this.getSolarMeanAnomaly(d),
            C = this.getEquationOfCenter(M),
            L = this.getEclipticLongitude(M, C),
            D = this.getDeclination(L, 0),
            A = this.getRightAscension(L, 0),
            t = this.getSiderealTime(d, lw),
            H = t - A;

        return {
            altitude: this.getAltitude(H, phi, D),
            azimuth: this.getAzimuth(H, phi, D) - this.PI / 2 // origin: north
        };
    }
}

//****** file: prefix.js ******
export default class OSMBuildings extends VectorLayer {
    constructor(map) {
        super(new VectorSource({
            projection: olProj.get("EPSG:900913")
        }));
        this.map = map;
        this.maxExtent = [-20037508.34, -20037508.34, 20037508.34, 20037508.34]; // MaxExtent of layer
        try {
            this.setMap(map);
            map.addLayer(this);

        } catch (e) {
            console.log(e);
        }

        //****** file: variables.js ******
        this.VERSION = "0.2.2b";
        this.ATTRIBUTION =
            '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>';
    }

    //****** file: adapter.js ******

    setGlobalOrigin(origin) {
        ORIGIN_X = origin.x;
        ORIGIN_Y = origin.y;
    }

    moveCam(offset) {
        CAM_X = CENTER_X + offset.x;
        CAM_Y = HEIGHT + offset.y;
        layers.render(true);
    }

    setSize(size) {
        WIDTH = size.width;
        HEIGHT = size.height;
        CENTER_X = (WIDTH / 2) << 0;
        CENTER_Y = (HEIGHT / 2) << 0;

        CAM_X = CENTER_X;
        CAM_Y = HEIGHT;

        layers.setSize(WIDTH, HEIGHT);
        MAX_HEIGHT = CAM_Z - 50;
    }

    setZoom(z) {
        ZOOM = z;
        MAP_SIZE = MAP_TILE_SIZE << ZOOM;

        var center = Functions.pixelToGeo(ORIGIN_X + CENTER_X, ORIGIN_Y + CENTER_Y);
        var a = Functions.geoToPixel(center.latitude, 0);
        var b = Functions.geoToPixel(center.latitude, 1);
        PIXEL_PER_DEG = b.x - a.x;

        ZOOM_FACTOR = pow(0.95, ZOOM - MIN_ZOOM);

        WALL_COLOR_STR = "" + WALL_COLOR.alpha(ZOOM_FACTOR);
        ALT_COLOR_STR = "" + ALT_COLOR.alpha(ZOOM_FACTOR);
        ROOF_COLOR_STR = "" + ROOF_COLOR.alpha(ZOOM_FACTOR);
    }

    onResize(e) {
        setSize(e);
        layers.render();
        data.update();
    }

    onMoveEnd(e) {
        layers.render();
        data.update(); // => fadeIn() => layers.render()
    }

    onZoomStart() {
        isZooming = true;
        // effectively clears because of isZooming flag
        // TODO: introduce explicit clear()
        layers.render();
    }

    onZoomEnd(e) {
        isZooming = false;
        setZoom(e.zoom);
        data.update(); // => fadeIn()
        layers.render();
    }

    setOrigin() {
        //console.log("setOrigin");
        var map = this.map;
        try {
            var origin = map.getCoordinateFromPixel([0, 0]);
            var res = map.getView().getResolution();
            var ext = this.maxExtent;
            var x = ((origin[0] - ext[0]) / res) << 0;
            var y = ((ext[3] - origin[1]) / res) << 0;
            this.setGlobalOrigin({
                x: x,
                y: y
            });
        } catch (e) {
            console.log(e);
        }
    };

    setMap(map) {
        //console.log("setMap");
        var scope = this;
        layers.appendTo(document.getElementById(map.getTargetElement().id));
        this.setSize({
            width: map.getSize()[0],
            height: map.getSize()[1]
        });

        var layerProjection = map.getView().getProjection();
        map.on("click", function(e) {
            var id = hitAreas.getIdFromXY(e.pixel[0], e.pixel[1]);
            if (id) {
                var geo = olProj.transform(
                    map.getCoordinateFromPixel([e.pixel[0], e.pixel[1]]),
                    layerProjection,
                    map.getView().getProjection()
                );
                scope.onClick({
                    feature: id,
                    lat: geo[0],
                    lon: geo[1]
                });
            }
        });

        // map.on('moveend', scope.onMoveEnd);
        // map.on('zoomend', scope.onZoomStart);
        // map.on('zoomstart', scope.onZoomEnd);

        // TODO why doesn't scope.on work like in OL3
        map.on("precompose", function(e) {
            //console.log("precompose");
            scope.setZoom(map.getView().getZoom());
            scope.setOrigin();
            data.resetItems();
            data.update();
        });

    }

    //****** file: public.js ******

    style = function(style) {
        //console.log("style");
        style = style || {};
        var color;
        if ((color = style.color || style.wallColor)) {
            WALL_COLOR = Color.parse(color);
            WALL_COLOR_STR = "" + WALL_COLOR.alpha(ZOOM_FACTOR);

            ALT_COLOR = WALL_COLOR.lightness(0.8);
            ALT_COLOR_STR = "" + ALT_COLOR.alpha(ZOOM_FACTOR);

            ROOF_COLOR = WALL_COLOR.lightness(1.2);
            ROOF_COLOR_STR = "" + ROOF_COLOR.alpha(ZOOM_FACTOR);
        }

        if (style.roofColor) {
            ROOF_COLOR = Color.parse(style.roofColor);
            ROOF_COLOR_STR = "" + ROOF_COLOR.alpha(ZOOM_FACTOR);
        }

        if (style.shadows !== undefined) {
            shadows.enabled = !!style.shadows;
        }

        layers.render();

        return this;
    };

    date = function(date) {
        shadows.date = date;
        shadows.render();
        return this;
    };

    load = function(url) {
        data.load(url);
        return this;
    };

    set(dataToSet) {
        data.set(dataToSet);
        return this;
    };
	
	getDataItems(){
		return data.getItems();
	};

    onEach = function() {};
    each = function(handler) {
        this.onEach = function(payload) {
            return handler(payload);
        };
        return this;
    };

    onClick = function(){};
    click = function(handler) {
        this.onClick = function(payload) {
            return handler(payload);
        };
        return this;
    };
}

// Global vars

var PI = Math.PI;
var HALF_PI = PI / 2;
var QUARTER_PI = PI / 4;

var DATA_TILE_SIZE = 0.0075; // data tile size in geo coordinates, smaller: less data to load but more requests
var ZOOM;
var MAP_SIZE;
var MAP_TILE_SIZE = 256; // map tile size in pixels

var MIN_ZOOM = 15;

var LAT = "latitude";
var LON = "longitude";

var TRUE = true;
var FALSE = false;

var WIDTH = 0;
var HEIGHT = 0;
var CENTER_X = 0;
var CENTER_Y = 0;
var ORIGIN_X = 0;
var ORIGIN_Y = 0;

var WALL_COLOR = Color.parse("rgba(200, 190, 180)");
var ALT_COLOR = WALL_COLOR.lightness(0.8);
var ROOF_COLOR = WALL_COLOR.lightness(1.2);

var WALL_COLOR_STR = "" + WALL_COLOR;
var ALT_COLOR_STR = "" + ALT_COLOR;
var ROOF_COLOR_STR = "" + ROOF_COLOR;

var PIXEL_PER_DEG = 0;
var ZOOM_FACTOR = 1;

var MAX_HEIGHT; // taller buildings will be cut to this
var DEFAULT_HEIGHT = 5;

var CAM_X;
var CAM_Y;
var CAM_Z = 450;

var isZooming;

var EARTH_RADIUS = 6378137;

//****** file: shortcuts.js ******

// object access shortcuts
var m = Math;
var exp = m.exp;
var log = m.log;
var sin = m.sin;
var cos = m.cos;
var tan = m.tan;
var atan = m.atan;
var atan2 = m.atan2;
var min = m.min;
var max = m.max;
var sqrt = m.sqrt;
var ceil = m.ceil;
var floor = m.floor;
var round = m.round;
var pow = m.pow;

// polyfills

var Int32Array = Int32Array || Array;
var Uint8Array = Uint8Array || Array;

var IS_IOS = /iP(ad|hone|od)/g.test(navigator.userAgent);
var IS_MSIE = !!~navigator.userAgent.indexOf("Trident");
var requestAnimFrame =
    window.requestAnimationFrame && !IS_IOS && !IS_MSIE ?
    window.requestAnimationFrame :
    function(callback) {
        callback();
    };
	
// Objects use for constructing different aspects of buildings 
var shadows = new Shadows();
var simplified = new Simplified();
var buildings = new Buildings();
var hitAreas = new HitAreas();
// Object holds the json data
var data = new Data();
// Renders the buildings and properties (e.g. shadows, etc.)
var layers = new Layers();