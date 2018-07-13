'use strict';

class NotificationsController {
  constructor(Auth, $state, $http, $scope, $rootScope, $interval, CommentsService) {
    let root = this;
    this.errors = {};
    this.submitted = false;

    this.$state = $state;
    this.$scope = $scope;
    this.$http = $http;
    this.getCurrentUser = Auth.getCurrentUser;
    this.isLoggedIn = Auth.isLoggedIn;
    $scope.user = this.getCurrentUser();

    $scope.comments = [];
    $scope.commentsNumber = 0;

    $('#notifications-container').click((event) => {
      event.stopPropagation();
    });

    $scope.$on('commentsUpdated', (commentId) => {
      $scope.commentsNumber--;
      _.each($scope.comments, (comment, i) => {
        if (comment._id === commentId) {
          comment.showUnviewed = false;
          comment.viewed = true;
        }
      });
    });

    this.commentsWatcher = function() {
      if(!$scope.user._id){
        $scope.comments = [];
        return;
      }

      CommentsService.getNewComments($scope.user._id)
        .then((result) => {
        let comments = result;
        $scope.commentsNumber = comments.length;

        _.each(comments, (comment) => {
          comment.showUnviewed = true;
          console.log('check that')
          comment.link = ($scope.user.role == 'user' ? '/offers/public/' : '/offers/' );
          comment.link += comment.offerId;
          comment.link += '#id' + comment._id;
        });

        $scope.comments = comments;
      });
    }

    this.commentsWatcher();

    let sync = $interval(root.commentsWatcher, (1000 * 60));
    $scope.$on('$destroy', function () {
      $interval.cancel(sync);
    });
  }

}

angular.module('cateringApp')
  .controller('NotificationsController', NotificationsController);
