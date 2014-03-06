var Debug = {

  marker: function(p, color, size) {
    this.context.fillStyle = color || '#ffcc00';
    this.context.beginPath();
    this.context.arc(p.x, p.y, size || 3, 0, PI*2, true);
    this.context.closePath();
    this.context.fill();
  },

  line: function(a, b, color) {
    this.context.strokeStyle = color || '#ff0000';
    this.context.beginPath();
    this.context.moveTo(a.x, a.y);
    this.context.lineTo(b.x, b.y);
    this.context.closePath();
    this.context.stroke();
  },

  clear: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  }
};
