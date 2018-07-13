'use strict';

angular.module('cateringApp')
  .factory('OffersService', function($http, $rootScope, socket, Auth, $state, $cookies) {
    return {
      getOfferById(id) {
        return $http.get('/api/offers/' + id).then(response => {
          return response.data;
        })
          .catch(err => {
            return err.message;
        });
      },
      decline(id) {
        $http.post('/api/offers/' + id + '/decline', {status: 'declined'}).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      total(eventId) {
        $http.post('/api/offers/total', {eventId: eventId}).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      getFilteredOffers(params) {
        return $http.post('/api/offers/filtered', params).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      getOfferState(id) {
        return $http.post('/api/offers/' + id + '/state').then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      isUpdated(id) {
        return $http.post('/api/offers/' + id + '/isUpdated').then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      degradeToDraft(id) {
        $http.post('/api/offers/' + id + '/degrade').then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      }
  }
});
