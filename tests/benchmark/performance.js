function Perf(name, iterations) {
	this.tests = [];
	this.iterations = iterations;

	log(name + ', ' + this.iterations + ' iterations');

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
    var test,
        start, minTime = Infinity, percent;

    for (var i = 0, il = this.tests.length; i < il; i++) {
        test = this.tests[i];
        start = performance.now();
        for (var j = 0; j < this.iterations; j++) {
            test.func(j);
        }
        test.time = (performance.now() - start) / this.iterations;
        if (!i) {
            minTime = test.time;
        }
    }

    for (var i = 0, il = this.tests.length; i < il; i++) {
        test = this.tests[i];
        if (!i) {
            log(test.name + ': ' + test.time.toFixed(3) + 'ms');
        } else {
            percent = test.time * 100 / minTime - 100;
            log(test.name + ': ' + (percent >= 0 ? '+' : '') + parseInt(percent) + '%');
        }
    }
};

Perf.random = function (min, max) {
	var r;
	do {
		r = Math.random();
	} while (r === 1.0);
	return min + parseInt(r * (max - min + 1), 10);
};
