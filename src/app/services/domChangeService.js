/**
 * service DomChangeService
 */
(function () {

  angular.module('Uploader.services')
  .service('DomChangeService', [function () {

    var displayNoneStyle = 'display:none';
    var displayBlockStyle = 'display:block';

    var unfullContentClass = 'col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main';


    this.changeToMainStyle = function () {
      var loginShowElements = document.getElementsByClassName('loginShow');
      for(var i=0;i<loginShowElements.length;i++){
        angular.element(loginShowElements[i]).attr('style', displayBlockStyle);
      }
      angular.element(document.getElementById('sideNavBar')).attr('style', displayBlockStyle);
      var historyLink = angular.element(document.getElementById('historyLink'))
      historyLink.html('上传记录');
      
      
    }

    this.changeToLoginStyle = function () {
      
      var loginShowElements = document.getElementsByClassName('loginShow');
      for(var i=0;i<loginShowElements.length;i++){
        angular.element(loginShowElements[i]).attr('style', displayNoneStyle);
      }
      angular.element(document.getElementById('sideNavBar')).attr('style', displayNoneStyle);
    }

    this.changeToHistoryStyle = function () {
      logger.debug('change to history style!!!!!');
      var historyLink = angular.element(document.getElementById('historyLink'))
      historyLink.html('返回');
    }

  }])

})();