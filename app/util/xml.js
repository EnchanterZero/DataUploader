
/* eslint-disable */

const xml = {
  // Changes content to JSON
  toJson: function(content) {
  	// Create the return object
  	var obj = {};

  	if (content.nodeType == 1) { // element
  		// do attributes
  		if (content.attributes.length > 0) {
  		obj["@attributes"] = {};
  			for (var j = 0; j < content.attributes.length; j++) {
  				var attribute = content.attributes.item(j);
  				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
  			}
  		}
  	} else if (content.nodeType == 3) { // text
  		obj = content.nodeValue;
  	}

  	// do children
  	if (content.hasChildNodes()) {
  		for(var i = 0; i < content.childNodes.length; i++) {
  			var item = content.childNodes.item(i);
  			var nodeName = item.nodeName;
  			if (typeof(obj[nodeName]) == "undefined") {
  				obj[nodeName] = xml.toJson(item);
  			} else {
  				if (typeof(obj[nodeName].push) == "undefined") {
  					var old = obj[nodeName];
  					obj[nodeName] = [];
  					obj[nodeName].push(old);
  				}
  				obj[nodeName].push(xml.toJson(item));
  			}
  		}
  	}
  	return obj;
  }
}

export default xml;
