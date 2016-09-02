var Utils = function () {
  var KB = 1024;
  var MB = 1024 * KB;
  var GB = 1024 * MB;
  var getFormatDateString = function (date) {
    var y = date.getFullYear();
    var mo = _.padStart(date.getMonth() + 1, 2, '0');
    var d = _.padStart(date.getDate() + 1, 2, '0');
    var h = _.padStart(date.getHours(), 2, '0');
    var mi = _.padStart(date.getMinutes(), 2, '0');
    var s = _.padStart(date.getSeconds(), 2, '0');
    return y + '年' + mo + '月' + d + '日 ' + h + ':' + mi + ':' + s;
  };
  var getFormatSpeedString = function (speed) {
    speed = speed*1;
    if (speed < KB)
      return (speed).toFixed(2) + 'B/s';
    else if (speed <= MB)
      return (speed / KB).toFixed(2) + 'KB/s';
    else
      return (speed / MB).toFixed(2) + 'MB/s';
  }
  var getFormatSizeString = function (size) {
    size = size*1;
    if (size < KB)
      return (size).toFixed(2) + 'B';
    else if (size <= MB)
      return (size / KB).toFixed(2) + 'KB';
    else if (size <= GB)
      return (size / MB).toFixed(2) + 'MB';
    else
      return (size / GB).toFixed(2) + 'GB';
  }
  this.getFormatDateString = getFormatDateString;
  this.getFormatSpeedString = getFormatSpeedString;
  this.getFormatSizeString = getFormatSizeString;
  this.formatList = function (arr, oldArr) {
    arr.map(function (item) {
      var date;
      var syncId = item.syncId;
      if (typeof item['createdAt'] != 'undefined') {
        date = new Date(Date.parse(item['createdAt']));
        item['createdAt'] = getFormatDateString(date);
      }
      if (typeof item['updatedAt'] != 'undefined') {
        date = new Date(Date.parse(item['updatedAt']));
        item['updatedAt'] = getFormatDateString(date);
      }
      if (typeof item['size'] != 'undefined') {
        item['size'] = getFormatSizeString(item['size']);
      }
      if (typeof item['speed'] != 'undefined') {
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
          if (!lastItem || !lastItem['checkPoint'] || !item['checkPoint']) {
            item['speed'] = getFormatSpeedString(0);
          } else {
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
      if (typeof item['progress'] != 'undefined') {
        item['progress'] = (item['progress'] * 100).toFixed(2);
      }
    });
    //handle working
    if (oldArr) {
      oldArr.map(function (item) {
        if (item['working'] === true) {
          var newItem = _.find(arr, function (o) {
            return o.syncId == item.syncId
          });
          if (newItem) {
            if (newItem.status == 'pausing' || newItem.status == item.status) {
              newItem['working'] = true;
              newItem['workingStatus'] = item['workingStatus']
            } else {
              newItem['working'] = false;
            }

          }
        }
      });
    }
    return arr;
  };
  this.minAssignList = function (changingArr, newArr) {

    //cut down changingArr length
    while (changingArr.length > newArr.length) {
      changingArr.pop();
    }
    //now assign new values one by one till not match
    for (var it in newArr) {
      if (changingArr[it]) {
        if (changingArr[it].id == newArr[it].id) {
          //assign necessary values
          if (changingArr[it].progress != newArr[it].progress)
            changingArr[it].progress = newArr[it].progress;

          if (changingArr[it].speed != newArr[it].speed)
            changingArr[it].speed = newArr[it].speed;

          if (changingArr[it].status != newArr[it].status)
            changingArr[it].status = newArr[it].status;

          if (changingArr[it].checkPointTime != newArr[it].checkPointTime)
            changingArr[it].checkPointTime = newArr[it].checkPointTime;

          if (changingArr[it].checkPoint != newArr[it].checkPoint)
            changingArr[it].checkPoint = newArr[it].checkPoint;

          if (changingArr[it].updatedAt != newArr[it].updatedAt)
            changingArr[it].updatedAt = newArr[it].updatedAt;

          if (typeof newArr[it].working != 'undefined' && !(typeof changingArr[it].working != 'undefined' && changingArr[it].working == newArr[it].working))
            changingArr[it].working = newArr[it].working;
          if (newArr[it].workingStatus)
            changingArr[it].workingStatus = newArr[it].workingStatus;

        } else {
          changingArr[it] = newArr[it];
        }
      }
      else {
        changingArr.push(newArr[it])
      }
    }
  };
  return this;
}
var utils = new Utils();