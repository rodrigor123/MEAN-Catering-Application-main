'use strict';

angular.module('cateringApp.auth', ['cateringApp.constants', 'cateringApp.util', 'ngCookies',
    'ui.router'
  ])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
