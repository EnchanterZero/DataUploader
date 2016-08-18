var Utils = function () {
  var KB = 1024;
  var MB = 1024 * KB;
  var GB = 1024 * MB;
  var getFormatDateString = function (date) {
    return date.getFullYear() + '年' + date.getMonth() + '月' + date.getDay() + '日 ' +
      date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  };
  var getFormatSpeedString = function (speed) {
    if (speed < KB)
      return (speed).toFixed(2) + 'B/s';
    else if (speed <= MB)
      return (speed / KB).toFixed(2) + 'KB/s';
    else
      return (speed / MB).toFixed(2) + 'MB/s';
  }
  var getFormatSizeString = function (size) {
    if (size < KB)
      return (size).toFixed(2) + 'B';
    else if (size <= MB)
      return (size / KB).toFixed(2) + 'KB';
    else if (size <= GB)
      return (size / MB).toFixed(2) + 'MB';
    else
      return (size / GB).toFixed(2) + 'GB';
  }
  this.formatList = function (arr, oldArr) {
    arr.map(function (item) {
      var date;
      var syncId = item.syncId;
      if (item['createdAt']) {
        date = new Date(Date.parse(item['createdAt']));
        item['createdAt'] = getFormatDateString(date);
      }
      if (item['updatedAt']) {
        date = new Date(Date.parse(item['updatedAt']));
        item['updatedAt'] = getFormatDateString(date);
      }
      if(item['size']){
        item['size'] = getFormatSizeString(item['size']);
      }
      if (item['speed']) {
        //the item is a finished or a pausing item
        if (item['status'] != 'uploading') {
          //console.log("original item['speed']-->" + item['speed']);
          item['speed'] = getFormatSpeedString(item['speed'] * 1)
        }
        //the item is a uploading item
        else {
          var lastItem = _.find(oldArr, function (o) {
            return o.syncId == syncId
          });
          //no checkPoint means speed should be 0
          if(!lastItem || !lastItem['checkPoint'] || !item['checkPoint']){
            item['speed'] = getFormatSpeedString(0);
          }else {
            var cpt = JSON.parse(item['checkPoint']);
            var lastCpt = JSON.parse(lastItem['checkPoint']);
            var v = (cpt.nextPart - lastCpt.nextPart) * cpt.partSize;
            if (lastItem['checkPointTime'] != 0 && v != 0) {
              item['speed'] = getFormatSpeedString(v / ((item['checkPointTime'] - lastItem['checkPointTime']) / 1000));
            } else
              item['speed'] = getFormatSpeedString(0);
          }
        }
      }
      if (item['progress']) {
        item['progress'] = (item['progress'] * 100).toFixed(2);
      }
    });
    return arr;
  };
  return this;
}
var utils = new Utils();