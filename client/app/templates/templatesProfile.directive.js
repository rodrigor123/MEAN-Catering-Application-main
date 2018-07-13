'use strict';

angular.module('cateringApp')
  .directive('templatesprofile', () => ({
    controller: 'TemplatesController',
    controllerAs: 'tc',
    templateUrl: 'app/templates/templatesProfile.html',
    restrict: 'E'
  }));
