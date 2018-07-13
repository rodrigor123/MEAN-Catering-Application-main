'use strict';

angular.module('cateringApp')
  .directive('payments', () => ({
    controller: 'PaymentListController',
    controllerAs: 'plc',
    templateUrl: 'app/payments/payments-list.html',
    restrict: 'E'
  }));
