'use strict';

angular.module('cateringApp')
  .directive('offerslist', () => ({
    controller: 'OffersController',
    controllerAs: 'oc',
    scope: {
      past: '=past'
    },
    templateUrl: 'app/offers/offers.html',
    restrict: 'E'
  }));
