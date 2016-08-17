var Utils = function(){
  var getFormatDateString = function(date) {
    return date.getFullYear()+'年'+ date.getMonth()+'月' +date.getDay()+ '日 ' +
      date.getHours() + ':'+date.getMinutes()+':'+date.getSeconds();
  };
  this.formatList = function(arr){
    arr.map(function (item) {
      var date;
      if(item['createdAt']){
        date = new Date(Date.parse(item['createdAt']));
        item['createdAt'] = getFormatDateString(date);
      }
      if(item['updatedAt']){
        date = new Date(Date.parse(item['updatedAt']));
        item['updatedAt'] = getFormatDateString(date);
      }
      if(item['progress']){
        item['progress'] = (item['progress']*100).toFixed(2);
      }
    });
    return arr;
  };
  return this;
}
 var utils = new Utils();