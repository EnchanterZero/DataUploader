/**
 * service DomChangeService
 */
(function () {

  angular.module('Uploader.services')
  .service('DomChangeService', [function () {

    var displayNoneStyle = 'display:none';
    var displayBlockStyle = 'display:block';

    var unfullContentClass = 'col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main';
    this.changeToUsingStyle = function () {
      var loginShowElements = document.getElementsByClassName('loginShow');
      for(var i=0;i<loginShowElements.length;i++){
        angular.element(loginShowElements[i]).attr('style', displayBlockStyle);
      }
      angular.element(document.getElementById('sideNavBar')).attr('style', displayBlockStyle);
    }
    this.changeToLoginStyle = function () {
      
      var loginShowElements = document.getElementsByClassName('loginShow');
      for(var i=0;i<loginShowElements.length;i++){
        angular.element(loginShowElements[i]).attr('style', displayNoneStyle);
      }
      angular.element(document.getElementById('sideNavBar')).attr('style', displayNoneStyle);
    }
  }])

})();