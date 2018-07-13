'use strict';

angular.module('cateringApp')
  .factory('ServiceTypesService', function($http) {
    return {
      getServiceTypes() {
        return $http.get('/api/serviceTypes/').then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      editServiceType(servicetype) {
        return $http.post('/api/serviceTypes/' + servicetype._id, servicetype).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      approveServiceType(id) {
        return $http.post('/api/serviceTypes/' + id, {approved: true}).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      addServiceType(servicetype) {
        return $http.post('/api/serviceTypes/', servicetype).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      deleteServiceType(id) {
        return $http.delete('/api/serviceTypes/' + id).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
    }
});
