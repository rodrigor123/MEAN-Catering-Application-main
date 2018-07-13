'use strict';

angular.module('cateringApp')
  .factory('CommentsService', function($http) {
    return {
      getComments(offerId) {
        return $http.get('/api/comments/thread/' + offerId).then(response => {
          return response.data;
        })
        .catch(err => {
          return [];
        });
      },
      getNewComments(userId) {
        return $http.post('/api/comments/new/', { target: userId, viewed: false }).then(response => {
          return response.data;
        })
        .catch(err => {
          return [];
        });
      },
      editComment(comment) {
        return $http.post('/api/comments/' + comment._id, comment).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      approveComment(id) {
        return $http.post('/api/comments/' + id, {approved: true}).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      addComment(comment) {
        return $http.post('/api/comments/add', comment).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      addChildComment(comment) {
        return $http.post('/api/comments/addChild', comment).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      deleteComment(id) {
        return $http.delete('/api/comment/' + id).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
    }
  });
