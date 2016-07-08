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

    loadImage.XmpMap = function () {
        return this
    };

    loadImage.XmpMap.prototype.get = function (id) {
        return this[id];
    }

    loadImage.parseXmpData = function (dataView, offset, length, data, options) {
        if (options.disableExif) {
            return;
        }

        // Check for the ASCII code for "http" (0x68747470). Note that the actual XMP identifier is quite long: "http://ns.adobe.com/xap/1.0/\x00"
        var offsetNamespace = 4;
        var lengthNamespace = 29;
        var arrNamespace = [];
        for (var i = 0; i < lengthNamespace; i++) {
            arrNamespace.push(String.fromCharCode(dataView.getUint8(offset + offsetNamespace + i)));
        }

        var namespace = arrNamespace.join("");
        if (namespace !== "http://ns.adobe.com/xap/1.0/\0") {
            // No XMP data.
            return;
        }

        var offsetLp = 2; // Offset to the packet length field.
        var packetLength = dataView.getUint16(offset + offsetLp);

        var lengthLp = 2;
        packetLength -= (lengthLp + lengthNamespace); // The packet length is a little misleading it includes the length of Lp and Namespace, remove those two to get the actual packet length.

        var maxPacketLength = 65503;
        if (maxPacketLength < packetLength) {
            // The length of the packet is not valid. Note that XMP does allow multiple packets but they are unlikely and NOT currently supported
            return;
        }

        // According to Adobe's document
        // (http://www.adobe.com/content/dam/Adobe/en/devnet/xmp/pdfs/XMPSpecificationPart3.pdf)
        // an EXIF encoding of XMP will always be UTF-8. No need to check for
        // bytes per character or endianness.

        // Find the start of packet data.
        var offsetPacket = offsetNamespace + lengthNamespace;
        var arrPacketData = [];
        for (var j = 0; j < packetLength; j++) {
            arrPacketData.push(String.fromCharCode(dataView.getUint8(offset + offsetPacket + j)));
        }
        var xml = arrPacketData.join("");

        loadImage.XmpMap.prototype.getXml = function (id) {
            return xml;
        }

        data.xmp = new loadImage.XmpMap();

        // Create an XMLDocument and extract the attributes from the
        // Description element.
        var xmlDocument = new DOMParser().parseFromString(xml, "application/xml");

        var document = xmlDocument.documentElement;
        if (!document) {
            return;
        }

        var xpath = "/*[namespace-uri()='adobe:ns:meta/' and local-name()='xmpmeta']/*[namespace-uri()='http://www.w3.org/1999/02/22-rdf-syntax-ns#' and local-name()='RDF']/*[namespace-uri()='http://www.w3.org/1999/02/22-rdf-syntax-ns#' and local-name()='Description']";
        var xpathResult;
        try {
            xpathResult = xmlDocument.evaluate(xpath, document, xmlDocument.createNSResolver(document), XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        } catch (err) {
            console.log("Error selecting Description node: '" + err.message || JSON.stringify(err) + "'.");
        }

        if (!xpathResult) {
            return;
        }

        if (xpathResult.resultType !== XPathResult.FIRST_ORDERED_NODE_TYPE) {
            console.log("xpathResult type " + xpathResult.resultType + " is not supported.");
            return;
        }

        var node = xpathResult.singleNodeValue;
        var attr;
        for (var k = 0; k < node.attributes.length; k++) {
            attr = node.attributes[k];

            // Don't include namespace definitions.
            if (attr.prefix === "xmlns"){
                continue;
            }

            data.xmp[attr.localName] = attr.value;
		}
    }

    loadImage.metaDataParsers.jpeg[0xffe1].push(loadImage.parseXmpData);
}))