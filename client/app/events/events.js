'use strict';

angular.module('cateringApp')
  .config(function($stateProvider, StripeCheckoutProvider) {

    $stateProvider.state('newEvent', {
      url: '/events/new',
      templateUrl: 'app/events/new.html',
      controller: 'EventsNewController',
      controllerAs: 'vm',
      authenticate: 'user',
      resolve:{
        stripe: StripeCheckoutProvider.load
      }
    })
      .state('events', {
      url: '/events/list/:time',
      templateUrl: 'app/events/events.html',
      controller: 'EventsController',
      controllerAs: 'vm',
      authenticate: true
    })

      .state('editEvent', {
        url: '/events/:id',
        templateUrl: 'app/events/edit.html',
        controller: 'EventsEditController',
        controllerAs: 'vm',
        authenticate: 'user'
      });
  });
