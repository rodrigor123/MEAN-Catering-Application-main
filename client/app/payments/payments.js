'use strict';

angular.module('cateringApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('dwolla', {
        url: '/dwolla',
        params: {
          offer:{}
        },
        templateUrl: 'app/payments/dwolla.html',
        controller: 'DwollaController',
        controllerAs: 'vm',
        authenticate: true,
        resolve: {
          authCode: function($location) {
            return $location.search().code;
          }
        }
      })
      .state('payments-list', {
        url: '/payments-list',
        templateUrl: 'app/payments/payments-list.html',
        controller: 'PaymentListController',
        controllerAs: 'vm',
        authenticate: true,
        resolve: {
          authCode: function($location) {
            return $location.search().code;
          }
        }
      });
  });
