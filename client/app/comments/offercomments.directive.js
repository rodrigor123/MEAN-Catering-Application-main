'use strict';

angular.module('cateringApp')
  .directive('offercomments', () => ({
  controller: 'OfferCommentsController',
  controllerAs: 'occ',
  scope: {
    offer: '=offer'
  },
  templateUrl: 'app/comments/offercomments.html',
  restrict: 'EAC'
}));
