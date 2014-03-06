var Cache = {

  time: new Date(),
  data: {},

  add: function(data, key) {
    this.data[key] = { data:data, time:Date.now() };
  },

  get: function(key) {
    return this.data[key] && this.data[key].data;
  },

  purge: function() {
    this.time.setMinutes(this.time.getMinutes()-5);
    for (var key in this.data) {
      if (this.data[key].time < this.time) {
        delete this.data[key];
      }
    }
  }
};
