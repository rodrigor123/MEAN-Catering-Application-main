'use strict';

angular.module('cateringApp')
  .config(function($stateProvider) {
    $stateProvider.state('templates', {
      url: '/templates',
      templateUrl: 'app/templates/templates.html',
      controller: 'TemplatesController',
      controllerAs: 'tc',
      authenticate: 'caterer'
    });
  });
