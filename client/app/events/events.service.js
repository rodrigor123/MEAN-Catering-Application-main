'use strict';

angular.module('cateringApp')
  .factory('EventsService', function($http, $rootScope, socket, Auth, $state, $cookies) {
    return {
      getEventById(id) {
        return $http.get('/api/events/' + id).then(response => {
            return response.data;
          })
          .catch(err => {
            return err.message;
        });
      },
      getFilteredEvents(params) {
        return $http.post('/api/events/filtered', params).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      getEventState(id) {
        return $http.post('/api/events/' + id + '/state').then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      isUpdated(id) {
        return $http.post('/api/events/' + id + '/isUpdated').then(response => {
            return response.data;
        })
        .catch(err => {
            return err.message;
        });
      },
      isSentTo(id) {
        return $http.post('/api/events/' + id + '/isSentTo').then(response => {
            return response.data;
        })
        .catch(err => {
            return err.message;
        });
      },
      update(id, data) {
        return $http.put('/api/events/', data).then(response => {
          return response;
        })
        .catch(err => {
          return err.message;
        });
      }
    }
  });
