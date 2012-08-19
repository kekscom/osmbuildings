# Tech Notes

Whats done & why in terms of performance.

## Projection cache

Looks like this has been a bad idea. Removed.
(http://jsperf.com/projcache)

## Readable keys (for cryptic data)

Seems to be a good idea making these a bit more readable.
Loss expected but slight gain.
(http://jsperf.com/readable-keys)

## Combined 2d faces

UNdecided resilt
iPhone 4, iOS5: seperate faces are 56% slower
MBA 2010: combined faces are 68% slower
Staying with combined so far, probably add system detection.
http://jsperf.com/canvas-polygon-combiner/