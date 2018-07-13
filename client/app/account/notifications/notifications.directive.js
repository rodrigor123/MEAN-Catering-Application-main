'use strict';

angular.module('cateringApp')
  .directive('notifications', () => ({
    controller: 'NotificationsController',
    controllerAs: 'nc',
    templateUrl: 'app/account/notifications/notifications.html',
    restrict: 'E'
  }));
