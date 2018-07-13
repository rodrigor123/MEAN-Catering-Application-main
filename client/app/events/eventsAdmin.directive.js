'use strict';

angular.module('cateringApp')
  .directive('eventsadmin', () => ({
  controller: 'EventsAdminController',
  controllerAs: 'eac',
  templateUrl: 'app/events/eventsAdmin.html',
  restrict: 'E'
}));
