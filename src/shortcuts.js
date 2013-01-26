    // object access shortcuts
    var Int32Array = Int32Array || Array,
        Uint8Array = Uint8Array || Array,
        exp = Math.exp,
        log = Math.log,
        tan = Math.tan,
        atan = Math.atan,
        min = Math.min,
        max = Math.max,
        doc = global.document
    ;

    /*<debug=*/
    global.performance = global.performance || {};
    performance.now = (function() {
      return performance.now       ||
             performance.mozNow    ||
             performance.msNow     ||
             performance.oNow      ||
             performance.webkitNow ||
             function() { return Date.now(); };
    })();
    /*>*/
