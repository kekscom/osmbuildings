# Performance

What's done & why in terms of performance.

## IDEAS

- combine canvases
- render items of same style at once
- delete and redraw animated objects
- split off animated shadows
- combine simple buildings in low zoom
- use web workers for data processing
- adapt features dynamically
- pre-calc face direction
- consider using a render queue
- style lookup index


## Projection cache

Looks like this has been a bad idea - removed.
Probably develop the concept into rendering pipelines.
(http://jsperf.com/projcache)


## Readable keys (for compact data structures)

Seemed to be a good idea making these a bit more readable.
Loss expected but turned out to be a slight gain.
http://jsperf.com/readable-keys/2
TODO: Not true anymore. Refactor to objects/properties. DONE


## Combined 2d faces

iPhone4, iOS5: seperate faces are 56% slower
MBA 2010, Chrome: combined faces are 68% slower
Staying with combined so far, probably add system detection.
(http://jsperf.com/canvas-polygon-combiner)


## Typed arrays

Using slice() is not worth it, but it turned out dropping some typed arrays is a good idea.
Especially when these are created on each rendering pass.
(http://jsperf.com/slice-access)


## Canvas anti alias

While looking slick, it eats performance.
Not so on iPhone4, iOS5: it doesn't matter
MBA 2010, Chrome: anti alias is 24% slower
Node: for *any* test, stroking lines eats ~60% performance
(http://jsperf.com/canvas-anti-alias)


## Math round

Using ~~ for a while, it turns out, bit shift << 0 is even faster.
iPad4, iOS6: 12% faster
MBA 2010, Chrome: 25% faster
(http://jsperf.com/math-round-vs-hack/3)


## Public methods vs. closure(d) functions

Huge gain for methods on desktop browsers vs. Safari (mobile).
Will stay a bit until mobile catches up.
Finally, Safari 6 mobile beats it too.
http://jsperf.com/osmb-method-vs-function


## Considerations for further performance improvement

degrade instantly, increase slowly (take average score of a few passes)

### FADE IN
- NO_STROKES
- NO_SHADING
- NO_SHADOWS_SCALE
- NO_SCALE

### MOVE

### STATIC
- NO_STROKES
- NO_SHADING
- NO_FLAT
- NO_SHADOWS


http://jsperf.com/osmb-hidden-canvas4