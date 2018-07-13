'use strict';

angular.module('cateringApp')
  .factory('FoodTypesService', function($http) {
    return {
      getFoodTypes() {
        return $http.get('/api/foodTypes/').then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      editFoodType(foodtype) {
        return $http.post('/api/foodTypes/' + foodtype._id, foodtype).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      approveFoodType(id) {
        return $http.post('/api/foodTypes/' + id, {approved: true}).then(response => {
          return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      addFoodType(foodtype) {
        return $http.post('/api/foodTypes/', foodtype).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
      deleteFoodType(id) {
        return $http.delete('/api/foodTypes/' + id).then(response => {
            return response.data;
        })
        .catch(err => {
          return err.message;
        });
      },
    }
});
