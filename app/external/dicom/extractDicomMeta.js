
function getTag(tag)
{
    var group = tag.substring(1,5);
    var element = tag.substring(5,9);
    var tagIndex = ("("+group+","+element+")").toUpperCase();
    var attr = TAG_DICT[tagIndex];
    return attr;
}

function mapUid(str) {
    var uid = uids[str];
    if(uid) {
        return ' [ ' + uid + ' ]';
    }
    return '';
}

function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

const maxLength = 1000;

function convertData(dataSet, element, tag) {
    // use VR to display the right value
    var propertyName = element.tag;
    var vr;
    if (element.vr !== undefined) {
        vr = element.vr;
    }
    else {
        if (tag !== undefined) {
            vr = tag.vr;
        }
    }

    if (element.length === 0) {
        return null;
    }

    var text = "";

    // if the length of the element is less than 128 we try to show it.  We put this check in
    // to avoid displaying large strings which makes it harder to use.
    if (element.length < maxLength) {
        // Since the dataset might be encoded using implicit transfer syntax and we aren't using
        // a data dictionary, we need some simple logic to figure out what data types these
        // elements might be.  Since the dataset might also be explicit we could be switch on the
        // VR and do a better job on this, perhaps we can do that in another example

        // First we check to see if the element's length is appropriate for a UI or US VR.
        // US is an important type because it is used for the
        // image Rows and Columns so that is why those are assumed over other VR types.
        if (element.vr === undefined && tag === undefined) {
            if (element.length === 2) {
                text += " (" + dataSet.uint16(propertyName) + ")";
            }
            else if (element.length === 4) {
                text += " (" + dataSet.uint32(propertyName) + ")";
            }


            // Next we ask the dataset to give us the element's data in string form.  Most elements are
            // strings but some aren't so we do a quick check to make sure it actually has all ascii
            // characters so we know it is reasonable to display it.
            var str = dataSet.string(propertyName);
            var stringIsAscii = isASCII(str);

            if (stringIsAscii) {
                // the string will be undefined if the element is present but has no data
                // (i.e. attribute is of type 2 or 3 ) so we only display the string if it has
                // data.  Note that the length of the element will be 0 to indicate "no data"
                // so we don't put anything here for the value in that case.
                if (str !== undefined) {
                    // text += '"' + str + '"' + mapUid(str);
                    text += str;
                }
            }
            else {
                if (element.length !== 2 && element.length !== 4) {
                    // If it is some other length and we have no string
                    text += "<i>binary data</i>";
                }
            }
            return text;
        }
        else {
            function isStringVr(vr) {
                if (vr === 'AT'
                        || vr === 'FL'
                        || vr === 'FD'
                        || vr === 'OB'
                        || vr === 'OF'
                        || vr === 'OW'
                        || vr === 'SI'
                        || vr === 'SQ'
                        || vr === 'SS'
                        || vr === 'UL'
                        || vr === 'US'
                ) {
                    return false;
                }
                return true;
            }
            if (isStringVr(vr)) {
                // Next we ask the dataset to give us the element's data in string form.  Most elements are
                // strings but some aren't so we do a quick check to make sure it actually has all ascii
                // characters so we know it is reasonable to display it.
                var str = dataSet.string(propertyName);
                var stringIsAscii = isASCII(str);

                if (stringIsAscii) {
                    // the string will be undefined if the element is present but has no data
                    // (i.e. attribute is of type 2 or 3 ) so we only display the string if it has
                    // data.  Note that the length of the element will be 0 to indicate "no data"
                    // so we don't put anything here for the value in that case.
                    if (str !== undefined) {
                        // text += '"' + str + '"' + mapUid(str);
                        text += str;
                    }
                }
                else {
                    if (element.length !== 2 && element.length !== 4) {
                        // If it is some other length and we have no string
                        text += "<i>binary data</i>";
                    }
                }
                return text;
            }
            else if (vr === 'US') {
                return dataSet.uint16(propertyName);
            }
            else if (vr === 'SS') {
                return dataSet.int16(propertyName);
            }
            else if (vr === 'UL') {
                return dataSet.uint32(propertyName);
            }
            else if (vr === 'SL') {
                return dataSet.int32(propertyName);
            }
            else if (vr == 'FD') {
                return dataSet.double(propertyName);
            }
            else if (vr == 'FL') {
                return dataSet.float(propertyName);
            }
            else if (vr === 'OB' || vr === 'OW' || vr === 'UN' || vr === 'OF' || vr === 'UT') {
                if(element.length === 2) {
                    return "<i>binary data of length " + element.length + " as uint16: " +dataSet.uint16(propertyName);
                } else if(element.length === 4) {
                    return "<i>binary data of length " + element.length + " as uint32: " +dataSet.uint32(propertyName);
                } else {
                    return "<i>binary data of length " + element.length + " and VR " + vr + "</i>";
                }
            }
            else if(vr === 'AT') {
                var group = dataSet.uint16(propertyName, 0);
                var groupHexStr = ("0000" + group.toString(16)).substr(-4);
                var element = dataSet.uint16(propertyName, 1);
                var elementHexStr = ("0000" + element.toString(16)).substr(-4);
                return "x" + groupHexStr + elementHexStr;
            }
            else if(vr === 'SQ') {
            }
            else {
                // If it is some other length and we have no string
                return "<i>no display code for VR " + vr + " yet, sorry!</i>";
            }
        }
    }
    else {
        return "Can't display " + vr;
    }
}

function getMetaDataObject(dataSet, propertyName) {
    var obj = {};
    var element = dataSet.elements[propertyName];
    var tag = getTag(element.tag);
    if (tag === undefined) {
        obj.name = element.tag;
    }
    else {
        obj.name = tag.name;
    }
    obj.length = element.hadUndefinedLength ? -1 : element.length;
    obj.vr = element.vr;

    // Here we check for Sequence items and iterate over them if present.  items will not be set in the
    // element object for elements that don't have SQ VR type.  Note that implicit little endian
    // sequences will are currently not parsed.
    if (element.items) {
        obj.items = element.items.map(function (item) {
            return getMetaDataJSON(item.dataSet);
        });
    }
    else if (element.fragments) {
        // text += "encapsulated pixel data with " + element.basicOffsetTable.length + " offsets and " + element.fragments.length + " fragments";
        // title += "; dataOffset=" + element.dataOffset;
        // output.push("<li title='" + title + "'=>" + text + '</li>');
        /*
        output.push('<ul>');

        // each item contains its own data set so we iterate over the items
        // and recursively call this function
        var itemNumber = 0;
        element.fragments.forEach(function (fragment) {
            var str = '<li>Fragment #' + itemNumber++ + ' offset = ' + fragment.offset;
            str += '; length = ' + fragment.length + '</li>';
            output.push(str);
        });
        output.push('</ul>');
        */
    }
    else {
        obj.data = convertData(dataSet, element, tag);
    }
    return obj;
}

function getMetaDataJSON(dataSet) {
    var json = {};
    for(var propertyName in dataSet.elements) {
        var obj = getMetaDataObject(dataSet, propertyName);
        json[obj.name] = obj;
    }
    return json;
}
