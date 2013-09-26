var Color = (function() {

    var w3cColors = {
        aliceblue:'#f0f8ff',
        antiquewhite:'#faebd7',
        aqua:'#00ffff',
        aquamarine:'#7fffd4',
        azure:'#f0ffff',
        beige:'#f5f5dc',
        bisque:'#ffe4c4',
        black:'#000000',
        blanchedalmond:'#ffebcd',
        blue:'#0000ff',
        blueviolet:'#8a2be2',
        brown:'#a52a2a',
        burlywood:'#deb887',
        cadetblue:'#5f9ea0',
        chartreuse:'#7fff00',
        chocolate:'#d2691e',
        coral:'#ff7f50',
        cornflowerblue:'#6495ed',
        cornsilk:'#fff8dc',
        crimson:'#dc143c',
        cyan:'#00ffff',
        darkblue:'#00008b',
        darkcyan:'#008b8b',
        darkgoldenrod:'#b8860b',
        darkgray:'#a9a9a9',
        darkgreen:'#006400',
        darkkhaki:'#bdb76b',
        darkmagenta:'#8b008b',
        darkolivegreen:'#556b2f',
        darkorange:'#ff8c00',
        darkorchid:'#9932cc',
        darkred:'#8b0000',
        darksalmon:'#e9967a',
        darkseagreen:'#8fbc8f',
        darkslateblue:'#483d8b',
        darkslategray:'#2f4f4f',
        darkturquoise:'#00ced1',
        darkviolet:'#9400d3',
        deeppink:'#ff1493',
        deepskyblue:'#00bfff',
        dimgray:'#696969',
        dodgerblue:'#1e90ff',
        firebrick:'#b22222',
        floralwhite:'#fffaf0',
        forestgreen:'#228b22',
        fuchsia:'#ff00ff',
        gainsboro:'#dcdcdc',
        ghostwhite:'#f8f8ff',
        gold:'#ffd700',
        goldenrod:'#daa520',
        gray:'#808080',
        green:'#008000',
        greenyellow:'#adff2f',
        honeydew:'#f0fff0',
        hotpink:'#ff69b4',
        indianred :'#cd5c5c',
        indigo :'#4b0082',
        ivory:'#fffff0',
        khaki:'#f0e68c',
        lavender:'#e6e6fa',
        lavenderblush:'#fff0f5',
        lawngreen:'#7cfc00',
        lemonchiffon:'#fffacd',
        lightblue:'#add8e6',
        lightcoral:'#f08080',
        lightcyan:'#e0ffff',
        lightgoldenrodyellow:'#fafad2',
        lightgray:'#d3d3d3',
        lightgreen:'#90ee90',
        lightpink:'#ffb6c1',
        lightsalmon:'#ffa07a',
        lightseagreen:'#20b2aa',
        lightskyblue:'#87cefa',
        lightslategray:'#778899',
        lightsteelblue:'#b0c4de',
        lightyellow:'#ffffe0',
        lime:'#00ff00',
        limegreen:'#32cd32',
        linen:'#faf0e6',
        magenta:'#ff00ff',
        maroon:'#800000',
        mediumaquamarine:'#66cdaa',
        mediumblue:'#0000cd',
        mediumorchid:'#ba55d3',
        mediumpurple:'#9370db',
        mediumseagreen:'#3cb371',
        mediumslateblue:'#7b68ee',
        mediumspringgreen:'#00fa9a',
        mediumturquoise:'#48d1cc',
        mediumvioletred:'#c71585',
        midnightblue:'#191970',
        mintcream:'#f5fffa',
        mistyrose:'#ffe4e1',
        moccasin:'#ffe4b5',
        navajowhite:'#ffdead',
        navy:'#000080',
        oldlace:'#fdf5e6',
        olive:'#808000',
        olivedrab:'#6b8e23',
        orange:'#ffa500',
        orangered:'#ff4500',
        orchid:'#da70d6',
        palegoldenrod:'#eee8aa',
        palegreen:'#98fb98',
        paleturquoise:'#afeeee',
        palevioletred:'#db7093',
        papayawhip:'#ffefd5',
        peachpuff:'#ffdab9',
        peru:'#cd853f',
        pink:'#ffc0cb',
        plum:'#dda0dd',
        powderblue:'#b0e0e6',
        purple:'#800080',
        red:'#ff0000',
        rosybrown:'#bc8f8f',
        royalblue:'#4169e1',
        saddlebrown:'#8b4513',
        salmon:'#fa8072',
        sandybrown:'#f4a460',
        seagreen:'#2e8b57',
        seashell:'#fff5ee',
        sienna:'#a0522d',
        silver:'#c0c0c0',
        skyblue:'#87ceeb',
        slateblue:'#6a5acd',
        slategray:'#708090',
        snow:'#fffafa',
        springgreen:'#00ff7f',
        steelblue:'#4682b4',
        tan:'#d2b48c',
        teal:'#008080',
        thistle:'#d8bfd8',
        tomato:'#ff6347',
        turquoise:'#40e0d0',
        violet:'#ee82ee',
        wheat:'#f5deb3',
        white:'#ffffff',
        whitesmoke:'#f5f5f5',
        yellow:'#ffff00',
        yellowgreen:'#9acd32'
    };

    function hsla2rgb(hsla) { // h belongs to [0, 360]; s,l,a belong to [0, 1]
        var r, g, b;

        if (hsla.s === 0) {
            r = g = b = hsla.l; // achromatic
        } else {
            var q = hsla.l < 0.5 ? hsla.l * (1+hsla.s) : hsla.l + hsla.s - hsla.l * hsla.s,
                p = 2 * hsla.l-q;
            hsla.h /= 360;
            r = hue2rgb(p, q, hsla.h + 1/3);
            g = hue2rgb(p, q, hsla.h);
            b = hue2rgb(p, q, hsla.h - 1/3);
        }
        return new Color(
            r * 255 <<0,
            g * 255 <<0,
            b * 255 <<0,
            hsla.a
        );
    }

    function hue2rgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q-p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q-p) * (2/3 - t) * 6;
        }
        return p;
    }

    function Color(r, g, b, a) { // r,g,b belong to [0, 255]; a belongs to [0,1]
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = arguments.length < 4 ? 1 : a;
    }

    var proto = Color.prototype;

    proto.toString = function() {
//        if (this.a === 1) {
//            return '#' + ((1 << 24) + (this.r << 16) + (this.g << 8) + this.b).toString(16).slice(1, 7);
//        }
        return 'rgba(' + [this.r <<0, this.g <<0, this.b <<0, this.a.toFixed(2)].join(',') + ')';
    };

    proto.setLightness = function(l) {
        var hsla = Color.toHSLA(this);
        hsla.l *= l;
        hsla.l = Math.min(1, Math.max(0, hsla.l));
        return hsla2rgb(hsla);
    };

    proto.setAlpha = function(a) {
        return new Color(this.r, this.g, this.b, this.a * a);
    };

    /*
     * str can be in any of the following forms:
     * "#[00-ff][00-ff][00-ff]", "#[00-ff][00-ff][00-ff][00-ff]",
     * "rgb([0-255],[0-255],[0-255])", "rgba([0-255],[0-255],[0-255],[0-1])",
     * "hsl([0-360],[0-1],[0-1])", "hsla([0-360],[0-1],[0-1],[0-1])"
     */
    Color.parse = function(str) {
        var m;
        str += '';
        str = w3cColors[str] || str;
        if (~str.indexOf('#') && (m = str.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/))) {
            return new Color(
                parseInt(m[1], 16),
                parseInt(m[2], 16),
                parseInt(m[3], 16),
                m[4] ? parseInt(m[4], 16) / 255 : 1
            );
        }

        if ((m = str.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))) {
            return new Color(
                parseInt(m[1], 10),
                parseInt(m[2], 10),
                parseInt(m[3], 10),
                m[4] ? parseFloat(m[5]) : 1
            );
        }

        if ((m = str.match(/hsla?\(([\d.]+)\D+([\d.]+)\D+([\d.]+)(\D+([\d.]+))?\)/))) {
            return hsla2rgb({
                h: parseInt(m[1], 10),
                s: parseFloat(m[2]),
                l: parseFloat(m[3]),
                a: m[4] ? parseFloat(m[5]) : 1
            });
        }
    };

    Color.toHSLA = function(rgba) { // r,g,b belong to [0, 255]; a belongs to [0,1]
        var r = rgba.r/255,
            g = rgba.g/255,
            b = rgba.b/255,
            max = Math.max(r, g, b), min = Math.min(r, g, b),
            h, s, l = (max+min) / 2,
            d;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            d = max-min;
            s = l > 0.5 ? d / (2-max-min) : d / (max+min);
            switch (max) {
                case r: h = (g-b) / d + (g < b ? 6 : 0); break;
                case g: h = (b-r) / d + 2; break;
                case b: h = (r-g) / d + 4; break;
            }
            h /= 6;
        }

        return { h:h*360, s:s, l:l, a:rgba.a };
    };

    return Color;

}());
