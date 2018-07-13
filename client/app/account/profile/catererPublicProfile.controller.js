'use strict';

class CatererPublicProfileController {
  constructor(Auth, User, $cookies, $state, $http, FoodTypesService, ServiceTypesService, $scope, FileUploader, $rootScope, $timeout) {
    this.errors = {};
    this.submitted = false;

    this.$state = $state;
    this.$scope = $scope;
    this.$http = $http;
    this.ftService = FoodTypesService;
    this.sService = ServiceTypesService;

    this.user = $http.get('/api/users/' + $state.params.id).then(response => {
      this.user = response.data;
      console.log(response.data);
    })
    .catch(err => {
        return err.message;
    });

    this.$scope.serviceTypes = this.sService.getServiceTypes().then((data)=> {
      console.log(data);
      this.$scope.serviceTypes = data;
    });

    this.$scope.foodTypes = this.ftService.getFoodTypes().then((data)=> {
      this.$scope.foodTypes = data;
    });
  }

  checkFT(id) {
    let result = false;
    _.each(this.user.foodTypes, (item, i) => {
      if (item == id) {
        result = true;
      }
    });
    return result;
  }

  checkST(id) {
    let result = false;
    _.each(this.user.serviceTypes, (item, i) => {
      if (item == id) {
        result = true;
      }
    });
    return result;
  }

}

angular.module('cateringApp')
  .controller('CatererPublicProfileController', CatererPublicProfileController);
