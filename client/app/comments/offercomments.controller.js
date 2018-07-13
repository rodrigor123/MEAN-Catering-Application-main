'use strict';

class OfferCommentsController {
  constructor($http, $scope, $rootScope, socket, Auth, $cookies, CommentsService, $window, $uibPosition) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$cookies = $cookies;
    this.socket = socket;

    this.isLoggedIn = Auth.isLoggedIn;
    this.getCurrentUser = Auth.getCurrentUser;
    this.user = this.getCurrentUser();  //author

    this.CS = CommentsService;
    this.$scope.newComment = '';

    $scope.$on('commentsUpdated', (commentId) => {
      _.each($scope.comments, (comment, i) => {
        if (comment._id === commentId || (comment.viewed && comment.showUnviewed)) {
          $scope.comments[i].showUnviewed = false;
          $scope.comments[i].viewed = true;
        }
      });
    });

    $scope.$watch('offer', () => {
      if ($scope.offer) {
        this.CS.getComments($scope.offer._id).then((res) => {
          $scope.comments = res;
          _.each($scope.comments, (comment, i) => {
            comment.layout = 'offer';
            if (!comment.viewed && comment.userId !== this.user._id) {
              $scope.comments[i].showUnviewed = true;
            }
          });
        });
      }
    });
    /*this.deepSearch(function(item, array) {
      item.collapsed = false;
      item.toggled = true;
      item.new = '';
    });*/
  }

  deepSearch(todo) {
    _.each(this.$scope.comments, (level1) => {
      todo(level1, this.$scope.comments);
      if (level1.children) {
        _.each(level1.children, (level2) => {
          todo(level2, level1.children);
          if (level2.children) {
            _.each(level2.children, (level3) => {
              todo(level3, level2.children);
              if (level3.children) {
                _.each(level3.children, (level4) => {
                  todo(level4, level3.children);
                  if (level4.children) {
                    _.each(level4.children, (level5) => {
                      todo(level5, level4.children);
                    })
                  }
                })
              }
            })
          }
        })
      }
    });
  }

  create() {
    let newComment = {};
    newComment.parentId = '';
    newComment.date = new Date();
    newComment.userId = this.user._id;
    newComment.name = (this.user.role == 'caterer' ? this.user.companyName : (this.user.firstname + ' ' + this.user.lastname));
    if (this.user.role == 'caterer') {
      newComment.profileUrl = '/caterers/' + this.user._id;
    }
    newComment.offerId = this.$scope.offer._id;
    newComment.text = this.$scope.newComment;
    newComment.viewed = false;
    newComment.children = [];
    this.CS.addComment(newComment).then((comment) => {
      this.$scope.newComment = '';
      this.$scope.comments.push(comment);
      this.$rootScope.$broadcast('commentsUpdated', comment._id);
    });
  }

}


class OfferCommentController {
  constructor($http, $scope, $rootScope, socket, Auth, $cookies, CommentsService, $window, $uibPosition, $timeout) {
    let root = this;
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$cookies = $cookies;
    this.socket = socket;

    this.isLoggedIn = Auth.isLoggedIn;
    this.getCurrentUser = Auth.getCurrentUser;
    this.user = $scope.user = this.getCurrentUser();  //author

    this.CS = CommentsService;

    $scope.toggleFrom = function(comment) {
      if (comment.toggled) comment.toggled = false;
      else comment.toggled = true;
    }

    $scope.collapse = function(comment) {
      if (comment.collapsed) comment.collapsed = false;
      else comment.collapsed = true;
    }

    $scope.markAsRead = function(comment) {
      comment.viewed = true;
      $rootScope.$broadcast('commentsUpdated', comment._id);
      CommentsService.editComment(comment).then((comment) => {
          $scope.comment = comment;
          $scope.comment.showUnviewed = false;
        });
      }

    let $viewportt, $viewportb, $wrapper;

    function checkRead() {
      let offset = $wrapper.offset(),
        vptoffset = $viewportt.offset(),
        vpboffset = $viewportb.offset();

      if (!offset) {
        $timeout(checkRead, 300);
        return;
      }

      if (offset.top > vptoffset.top && offset.top < vpboffset.top) {
        $scope.markAsRead($scope.comment);
      }
    }

    function digestChecker() {
      if ($scope.comment.layout == 'offer') {
        $viewportt = $('#viewportt');
        $viewportb = $('#viewportb');
        $wrapper = $('#id' + $scope.comment._id);

        if ($scope.comment.layout == 'offer' &&
         !$scope.comment.viewed &&
         $scope.comment.target === $scope.user._id) {
          $($window).on('scroll', _.throttle(checkRead, 300));
          $($window).on('resize', _.throttle(checkRead, 300));
        }
      }
    }

    $timeout(digestChecker, 0);


    /*$scope.add = function(comment) {
      let newComment = {};
      newComment.parentId = comment._id;
      newComment.date = new Date();
      newComment.userId = root.user._id;
      newComment.name = (root.user.role == 'caterer' ? root.user.companyName : (root.user.firstname + ' ' + root.user.lastname));
      if (root.user.role == 'caterer') {
        newComment.profileUrl = '/caterers/' + root.user._id;
      }
      newComment.text = comment.new;
      CommentsService.addChildComment(newComment).then((data) => {
        if (comment.children) comment.children.push(data);
        else comment.children = [data];
        comment.collapsed = false;
      });
    }*/
  }
}


angular.module('cateringApp')
  .controller('OfferCommentsController', OfferCommentsController)
  .controller('OfferCommentController', OfferCommentController);

