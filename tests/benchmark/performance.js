function Perf(numItems, numIterations, url) {
	this.tests = [];
    this.numItems = numItems;
	this.numIterations = navigator.userAgent.toLowerCase().indexOf('mobile') > -1 ? numIterations / 10 <<0 : numIterations;
    this.url = url;
    this.results = [];
    this.baseTime = 0;

	this.log(this.numItems + ' items, ' + this.numIterations + ' iterations');

	performance = window.performance || {};
	performance.now = (function() {
	  return performance.now   ||
		 performance.mozNow    ||
		 performance.msNow     ||
		 performance.oNow      ||
		 performance.webkitNow ||
		 function() {
			return new Date().getTime();
		};
	})();
}

Perf.prototype.add = function (name, func) {
	this.tests.push({
		name: name,
		func: func,
        time: 0
	});
};

Perf.prototype.run = function () {
    this.next(0);
};

Perf.prototype.next = function (index) {
    var test = this.tests[index],
        percent;

    if (!test) {
        this.log('finished.');
        this.post();
        return;
    }

    var me = this;
    setTimeout(function() {
        var start = performance.now();
        for (var i = 0; i < me.numIterations; i++) {
            test.func(i);
        }
        test.time = (performance.now() - start) / me.numIterations;

        if (!index) {
            me.baseTime = test.time;
            me.log(test.name + ': ' + test.time.toFixed(3) + 'ms');
        } else {
            percent = test.time * 100 / me.baseTime - 100;
            me.log(test.name + ': ' + (percent >= 0 ? '+' : '') + parseInt(percent) + '%');
        }

        me.results.push({ name:test.name, time:parseFloat(test.time.toFixed(3)) });

        me.next(++index);
    }, 100);
};

Perf.random = function (min, max) {
	var r;
	do {
		r = Math.random();
	} while (r === 1.0);
	return min + parseInt(r * (max - min + 1), 10);
};

Perf.prototype.log = function (message) {
    if (console && console.log) {
        console.log(message)
    }
};

Perf.prototype.post = function() {
    var data = {
        iterations: this.numIterations,
        items: this.numItems,
        results: this.results,
        screen: {
            width: screen.width,
            height: screen.height
        },
        userAgent: navigator.userAgent
    };

var info = [], baseTime, percent;
info.push('iterations: ' + this.numIterations);
info.push('items: ' + this.numItems);
for (var i = 0, il = this.results.length; i < il; i++) {
    var test = this.results[i];
    if (!i) {
        baseTime = test.time;
        info.push(test.name + ': ' + test.time.toFixed(3) + 'ms');
    } else {
        percent = test.time * 100 / baseTime - 100;
        info.push(test.name + ': ' + (percent >= 0 ? '+' : '') + parseInt(percent) + '%');
    }
}

alert(info.join('\n'));
return;

    var json = encodeURIComponent(JSON.stringify(data));
    var xhr = new XMLHttpRequest;
	xhr.open('POST', this.url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Content-length', json.length);
    xhr.setRequestHeader('Connection', 'close');
	xhr.send(json);
};
