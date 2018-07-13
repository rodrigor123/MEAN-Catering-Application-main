'use strict';

angular.module('cateringApp')
  .config(function($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginController',
        controllerAs: 'vm'
      })
      .state('logout', {
        url: '/logout?referrer',
        referrer: 'main',
        template: '',
        controller: function($state, Auth) {
          var referrer = $state.params.referrer || $state.current.referrer || 'main';
          Auth.logout();
          $state.go(referrer);
        }
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupController',
        controllerAs: 'vm'
      })
      .state('reset', {
        url: '/reset',
        templateUrl: 'app/account/reset/reset.html',
        controller: 'ResetController',
        controllerAs: 'vm'
      })
      .state('verify', {
        url: '/verify/:id',
        templateUrl: 'app/account/verify/verify.html',
        controller: 'VerifyController',
        controllerAs: 'vm'
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'app/account/settings/settings.html',
        controller: 'SettingsController',
        controllerAs: 'vm',
        authenticate: true
      })
      .state('notifications', {
        url: '/notifications',
        templateUrl: 'app/account/notifications/notifications.html',
        controller: 'NotificationsController',
        controllerAs: 'vm',
        authenticate: true
      }) 
      .state('customer-profile', {
        url: '/profile/customer',
        templateUrl: 'app/account/profile/customer.html',
        controller: 'CustomerProfileController',
        controllerAs: 'customerProfile',
        authenticate: 'user'
      })
      .state('caterer-profile', {
        url: '/profile/caterer',
        templateUrl: 'app/account/profile/caterer.html',
        controller: 'CatererProfileController',
        controllerAs: 'catererProfile',
        authenticate: 'caterer'
      })
      .state('caterer-public-profile', {
        url: '/caterers/:id',
        templateUrl: 'app/account/profile/caterer_public.html',
        controller: 'CatererPublicProfileController',
        controllerAs: 'vm',
        authenticate: true
      });
  })
  .run(function($rootScope) {
    $rootScope.$on('$stateChangeStart', function(event, next, nextParams, current) {
      if (next.name === 'logout' && current && current.name && !current.authenticate) {
        next.referrer = current.name;
      }
    });
  });
