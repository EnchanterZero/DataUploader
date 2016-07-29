var dicomWriter = dicomWriter || {};




    function isValidVR(vr) {
      var validVR = {
        'OB': true,
        'AW': true,
        'AE': true,
        'AS': true,
        'CS': true,
        'UI': true,
        'DA': true,
        'DS': true,
        'DT': true,
        'IS': true,
        'LO': true,
        'LT': true,
        'OW': true,
        'PN': true,
        'ST': true,
        'TM': true,
        'UN': true,
        'UT': true,
        'SQ': true,
        'SH': true,
        'FL': true,
        'SL': true,
        'AT': true,
        'UL': true,
        'US': true,
        'SS': true,
        'FD': true,
      }
      return !!validVR[vr];
    }

    function getDataLengthSizeInBytesForVR(vr)
    {
        if (!isValidVR(vr) ||
              vr === 'OB' ||
              vr === 'OW' ||
              vr === 'SQ' ||
              vr === 'OF' ||
              vr === 'UT' ||
              vr === 'UN')
        {
            return 4;
        }
        else
        {
            return 2;
        }
    }

var anonymizeRules = {
    x00100010: { action: 'replace', value: 'Anonymous ' }
}

function getElementValueAsUint8Array (dataSet, element) {
    return dataSet.byteArray.subarray(element.dataOffset, element.dataOffset + element.length);
}

function readTransferSyntax(dataSet) {
    if(dataSet.elements.x00020010 === undefined) {
        throw 'dicomParser.parseDicom: missing required meta header attribute 0002,0010';
    }
    var transferSyntaxElement = dataSet.elements.x00020010;
    return dicomParser.readFixedString(dataSet.byteArray, transferSyntaxElement.dataOffset, transferSyntaxElement.length);
}

function writeElementTag(stream, element) {
    var group = parseInt(element.tag.substr(1, 4), 16);
    var elem = parseInt(element.tag.substr(5, 8), 16);
    stream.writeUint16(group, null);
    stream.writeUint16(elem, null);
    if (element.vr) {
        stream.writeString(element.vr, 'ASCII', null);
    }
}

function getElementTagSize(element) {
    return 4 + (element.vr ? 2 : 0);
}

function getElementLengthSize(element, length) {
    var lengthSize = getDataLengthSizeInBytesForVR(element.vr);
    if (length === undefined) {
        length = element.length;
    }
    if ( lengthSize == 4 ) {
        if (isValidVR(element.vr)) {
            return 6 + length;
        }
        return 4 + length;
    }
    else {
        return 2 + length;
    }
}

function writeElementLength(stream, element, length) {
    var lengthSize = getDataLengthSizeInBytesForVR(element.vr);
    if (length === undefined) {
        length = element.hadUndefinedLength ? -1 : element.length;
    }
    if ( lengthSize == 4 ) {
        if (isValidVR(element.vr)) {
            stream.seek(stream.position + 2);
        }
        stream.writeUint32(length, null);
    }
    else {
        stream.writeUint16(length, null);
    }
}

dicomWriter.writeDicom = function (dataSet, anonymize, filename) {
    var keys = Object.keys(dataSet.elements);
    keys.sort();

    var headerStart = keys.indexOf('x00020000'), headerEnd = -1;
    for (var i = 0; i < keys.length; ++i) {
        if (keys[i] >= 'x00030000') {
            headerEnd = i;
            break;
        }
    }
    if (headerStart == -1) {
        console.log('wrong');
    } else if (headerStart != 0) {
        var orderedKeys = keys.slice(headerStart, headerEnd);
        orderedKeys = orderedKeys.concat(keys.slice(0, headerStart));
        orderedKeys = orderedKeys.concat(keys.slice(headerEnd));
        keys = orderedKeys;
    }

    var totalLength = 128 + 4;
    for ( var j = 0 ; j < keys.length; ++j ) {
        var key = keys[j];
        element = dataSet.elements[key];
        if ( element && element.tag ) {
            if (anonymize && anonymizeRules[element.tag]) {
                var rule = anonymizeRules[element.tag];
                if (rule.action === 'replace') {
                    totalLength += getElementTagSize(element);
                    totalLength += getElementLengthSize(element, rule.value.length);
                } else if (rule.action === 'remove') {
                    continue;
                }
            } else if (key == 'x00020010') {
                var syntax = readTransferSyntax(dataSet);
                if (syntax === '1.2.840.10008.1.2.2' || syntax === '1.2.840.10008.1.2.1.99') {
                    syntax = '1.2.840.10008.1.2.1'
                }
                var length = syntax.length + (syntax.length % 2);
                totalLength += getElementTagSize(element);
                totalLength += getElementLengthSize(element, length);
            } else {
                totalLength += getElementTagSize(element);
                totalLength += getElementLengthSize(element);
            }
        }
    }


    var arrayBuffer = new ArrayBuffer(totalLength);
    var stream = new DataStream(arrayBuffer, 0, true);
    stream.seek(128);
    stream.writeString("DICM", "ASCII", null);
    for ( var j = 0 ; j < keys.length; ++j ) {
        var key = keys[j];
        element = dataSet.elements[key];
        if ( element && element.tag ) {
            if (anonymize && anonymizeRules[element.tag]) {
                var rule = anonymizeRules[element.tag];
                if (rule.action === 'replace') {
                    writeElementTag(stream, element)
                    writeElementLength(stream, element, rule.value.length);
                    stream.writeString(rule.value, 'ASCII', null);
                } else if (rule.action === 'remove') {
                    continue;
                }
            } else if (key == 'x00020010') {
                writeElementTag(stream, element);
                var syntax = readTransferSyntax(dataSet);
                if (syntax === '1.2.840.10008.1.2.2' || syntax === '1.2.840.10008.1.2.1.99') {
                    syntax = '1.2.840.10008.1.2.1'
                }
                var length = syntax.length + (syntax.length % 2);
                writeElementLength(stream, element, length);
                stream.writeString(syntax, 'ASCII', length);
            } else {
                if (element.tag == "x00080016") {
                    console.log('dd');
                }
                writeElementTag(stream, element);
                writeElementLength(stream, element);
                var vl = getElementValueAsUint8Array(dataSet, element);
                if (vl.length != element.length) {
                    console.log('dd');
                }
                stream.writeUint8Array(vl);
            }
        }
    }
    return arrayBuffer;
}



    function downloadBlobAsFile(data, fileName) {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        var blob = new Blob([data], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // var dataView = new DataView(arrayBuffer);
    // var blob = new Blob([dataView], {type: "octet/stream"});
    // downloadBlobAsFile(blob, filename)
