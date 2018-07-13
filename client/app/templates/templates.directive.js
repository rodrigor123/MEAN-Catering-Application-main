'use strict';

angular.module('cateringApp')
  .directive('templates', () => ({
    controller: 'TemplatesController',
    controllerAs: 'tc',
    templateUrl: 'app/templates/templates.html',
    restrict: 'E'
  }));
