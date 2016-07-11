;(function (factory) {
  'use strict'
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define(['./load-image', './load-image-exif'], factory)
  } else if (typeof module === 'object' && module.exports) {
    factory(require('./load-image'), require('./load-image-exif'))
  } else {
    // Browser globals:
    factory(window.loadImage)
  }
}(function (loadImage) {
  'use strict'

  loadImage.XmpMap.prototype.getAll = function () {
    var map = {};
    var prop;
    var id;
    for (prop in this) {
      if (this.hasOwnProperty(prop)) {
        map[prop] = this[prop];
      }
    }
    return map
  };

}));
