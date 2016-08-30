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
      angular.element(document.getElementById('logoutLink')).attr('style', displayBlockStyle);
      angular.element(document.getElementById('sideNavBar')).attr('style', displayBlockStyle);
    }
    this.changeToLoginStyle = function () {

      angular.element(document.getElementById('logoutLink')).attr('style', displayNoneStyle);
      angular.element(document.getElementById('sideNavBar')).attr('style', displayNoneStyle);
    }
  }])

})();