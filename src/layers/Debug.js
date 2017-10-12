var Debug = {

  context: null,

  init: function(context) {
    this.context = context;
  },

  clear: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  },

  setOpacity: function(opacity) {},

  point: function(x, y, color, size) {
    var context = this.context;
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(x, y, size || 3, 0, 2*PI);
    context.closePath();
    context.fill();
  },

  line: function(ax, ay, bx, by, color) {
    var context = this.context;
    context.strokeStyle = color || '#ffcc00';
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.stroke();
  }
};
