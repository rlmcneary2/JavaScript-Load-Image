; (function (factory) {
    'use strict'
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define(['./load-image', './load-image-meta'], factory)
    } else if (typeof module === 'object' && module.exports) {
        factory(require('./load-image'), require('./load-image-meta'))
    } else {
        // Browser globals:
        factory(window.loadImage)
    }
} (function (loadImage) {
    'use strict'

    loadImage.parseXmpData = function (dataView, offset, length, data, options) {
        if (options.disableExif) {
            return;
        }

        // Check for the ASCII code for "http" (0x68747470). Note that the actual XMP identifier is quite long: "http://ns.adobe.com/xap/1.0/\x00"
        var arrIdentifier = [];
        var offsetNamespace = 4;
        var lengthNamespace = 29;
        for (var i = 0; i < lengthNamespace; i++) {
            arrIdentifier[i] = String.fromCharCode(dataView.getInt8(offset + offsetNamespace + i));
        }

        var identifier = arrIdentifier.join("");
        if (identifier !== "http://ns.adobe.com/xap/1.0/\0") {
            // No XMP data.
            return;
        }

        var offsetLp = 2; // Offset to the packet length field.
        var xmpLength = dataView.getUint16(offset + offsetLp);

        var lengthLp = 2;
        xmpLength -= (lengthLp + lengthNamespace); // The packet length is a little misleading it includes the length of Lp and Namespace, remove those two to get the actual packet length.

        var maxPacketLength = 65503;
        if (maxPacketLength < xmpLength){
            return;
        }
    }

    loadImage.metaDataParsers.jpeg[0xffe1].push(loadImage.parseXmpData);
}))