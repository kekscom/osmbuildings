var Color = (function() {

    function hsla2rgb(hsla) { // h belongs to [0, 360]; s,l,a belong to [0, 1]
        var r, g, b;
        
        if (hsla.s === 0) {
            r = g = b = hsla.l; // achromatic
        } else {
            var
                q = hsla.l < 0.5 ? hsla.l * (1+hsla.s) : hsla.l + hsla.s - hsla.l * hsla.s,
                p = 2 * hsla.l-q
            ;
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

    function C(r, g, b, a) { // r,g,b belong to [0, 255]; a belongs to [0,1]
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = arguments.length < 4 ? 1 : a;
    }

	var proto = C.prototype;

	proto.toString = function() {
		return 'rgba(' + [this.r <<0, this.g <<0, this.b <<0, this.a.toFixed(2)].join(',') + ')';
	};

	proto.adjustLightness = function(l) {
		var hsla = Color.toHSLA(this);
		hsla.l *= l;
		hsla.l = Math.min(1, Math.max(0, hsla.l));
		return hsla2rgb(hsla);
	};

	proto.adjustAlpha = function(a) {
		return new Color(this.r, this.g, this.b, this.a * a);
	};

    /* 
     * str can be in any of the following forms:
     * "#[00-ff][00-ff][00-ff]", "#[00-ff][00-ff][00-ff][00-ff]",
     * "rgb([0-255],[0-255],[0-255])", "rgba([0-255],[0-255],[0-255],[0-1])",
     * "hsl([0-360],[0-1],[0-1])", "hsla([0-360],[0-1],[0-1],[0-1])"
     */
    C.parse = function (str) {
        var m;
        str += '';
        if (~str.indexOf('#')) {
            m = str.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);
            return new Color(
                parseInt(m[1], 16),
                parseInt(m[2], 16),
                parseInt(m[3], 16),
                m[4] ? parseInt(m[4], 16) / 255 : 1
            );
        }

        m = str.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/);
        if (m) {
            return new Color(
                parseInt(m[1], 10),
                parseInt(m[2], 10),
                parseInt(m[3], 10),
                m[4] ? parseFloat(m[5]) : 1
            );
        }

        m = str.match(/hsla?\(([\d.]+)\D+([\d.]+)\D+([\d.]+)(\D+([\d.]+))?\)/);
        if (m) {
            return hsla2rgb({
                h: parseInt(m[1], 10),
                s: parseFloat(m[2]),
                l: parseFloat(m[3]),
                a: m[4] ? parseFloat(m[5]) : 1
            });
        }
    };

    C.toHSLA = function (rgba) { // r,g,b belong to [0, 255]; a belongs to [0,1]
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
			s = l > 0.5 ? d / (2 - max - min) : d / (max+min);
			switch (max) {
				case r: h = (g-b) / d + (g < b ? 6 : 0); break;
				case g: h = (b-r) / d + 2; break;
				case b: h = (r-g) / d + 4; break;
			}
			h /= 6;
		}

        return { h: h*360, s: s, l: l, a: rgba.a };
    };

	return C;

}());
