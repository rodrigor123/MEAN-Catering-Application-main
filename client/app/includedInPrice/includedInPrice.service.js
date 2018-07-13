'use strict';

angular.module('cateringApp')
  .factory('IncludedInPriceService', function($http) {
    return {
      getIncludedInPrice() {
        return $http.get('/api/includedInPrice/').then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      editIncludedInPrice(includedInPrice) {
          return $http.post('/api/includedInPrice/' + includedInPrice._id, includedInPrice).then(response => {
              return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      addIncludedInPrice(includedInPrice) {
        return $http.post('/api/includedInPrice/', includedInPrice).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      deleteIncludedInPrice(id) {
        return $http.delete('/api/includedInPrice/' + id).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
  }
});
