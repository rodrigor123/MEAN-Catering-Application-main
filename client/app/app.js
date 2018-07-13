'use strict';

angular.module('cateringApp', ['cateringApp.auth', 'cateringApp.admin', 'cateringApp.constants',
    'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap',
    'validation.match', "checklist-model", "rzModule", "angularFileUpload", 'smart-table',
    // 'angularPayments',
    'ngAnimate', 'ui.comments.directive', 'angular-click-outside', 'stripe.checkout', 'credit-cards', 'stripe', 'ui.toggle'
  ])
  .config(function($urlRouterProvider, $locationProvider, commentsConfigProvider) {
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
    commentsConfigProvider.set({
      containerTemplate: 'assets/comments/template/comments/comments.html',
      commentTemplate: 'assets/comments/template/comments/comment.html',
      commentController: 'OfferCommentController'
    });
  })
  .run(function($http){

    $http.get('/api/payments/card/token').then(response => {
      Stripe.setPublishableKey(response.data.checkoutToken);
    })

  });
