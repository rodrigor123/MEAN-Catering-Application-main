'use strict';

angular.module('cateringApp')
  .config(function($stateProvider) {
    $stateProvider.state('offers', {
      url: '/offers',
      templateUrl: 'app/offers/offers.html',
      controller: 'OffersController',
      controllerAs: 'vm',
      authenticate: 'user'
    })
      .state('newOffer', {
        url: '/offers/new',
        templateUrl: 'app/offers/new.html',
        controller: 'OffersNewController',
        controllerAs: 'vm',
        authenticate: 'caterer'
      })
      .state('editOffer', {
        url: '/offers/:id',
        templateUrl: 'app/offers/edit.html',
        controller: 'OffersEditController',
        controllerAs: 'vm',
        authenticate: 'caterer'
      })
      .state('publicOffer', {
        url: '/offers/public/:id',
        templateUrl: 'app/offers/public.html',
        controller: 'OffersPublicController',
        controllerAs: 'vm',
        authenticate: true
      });
  });
