'use strict';

(function() {

  class AdminController {
    constructor(User, $scope, FoodTypesService, IncludedInPriceService, ServiceTypesService, $uibModal) {
      // Use the User $resource to fetch all users
      this.users = User.query();

      this.$scope = $scope;
      this.$scope.ft = {};
      this.$scope.ut = {};
      this.$scope.st = {};
      this.$uibModal = $uibModal;

      this.ftService = FoodTypesService;
      this.foodTypes = this.ftService.getFoodTypes().then((data)=> {
        this.foodTypes = data;
      });

      this.sService = ServiceTypesService;
      this.serviceTypes = this.sService.getServiceTypes().then((data)=> {
        this.serviceTypes = data;
      });

      this.incService = IncludedInPriceService;
      this.includedInPrice = this.incService.getIncludedInPrice().then((data)=> {
        this.includedInPrice = data;
      });

    }

    edit(user) {
      
      let templateUrl = '';
      let controller = '';
      let controllerAs = '';

      if(user.role == 'user'){
        templateUrl = 'app/account/profile/customer.html';
        controller = 'CustomerProfileAdminController';
        controllerAs = 'customerProfile';
      }else if(user.role == 'caterer'){
        templateUrl = 'app/account/profile/caterer.html';
        controller = 'CatererProfileAdminController';
        controllerAs = 'catererProfile';
      }

      let modalInstance = this.$uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        windowClass: 'profile-edit-modal',
        templateUrl: templateUrl,
        controller: controller,
        controllerAs: controllerAs,
        size: 'lg',
        resolve: {
          user: function () {
            return user;
          }
        }
      });
    }

    delete(user) {
      user.$remove();
      this.users.splice(this.users.indexOf(user), 1);
    }

    approveFoodType(type) {
      this.ftService.approveFoodType(type._id).then((data) => {
        _.each(this.foodTypes, (item, i) => {
          if (item._id == type._id) {
            this.foodTypes[i].approved = true;
          }
        });
      });
    }

    editFoodType(type) {
      this.ftService.editFoodType(type);
    }

    addFoodType() {
      let query = {
        name: this.$scope.ft.newFoodType,
        approved: false
      }
      this.ftService.addFoodType(query).then((data) => {
        this.foodTypes.push(data);
      });
    }

    deleteFoodType(type) {
      this.foodTypes.splice(this.foodTypes.indexOf(type), 1);
      this.ftService.deleteFoodType(type._id);
    }

    deleteIncludedInPrice(ut) {
      this.includedInPrice.splice(this.includedInPrice.indexOf(ut), 1);
      this.incService.deleteIncludedInPrice(ut._id);
    }

    editIncludedInPrice(ut) {
      this.incService.editIncludedInPrice(ut);
    }

    addIncludedInPrice() {
      let query = {
        name: this.$scope.ut.newUt,
        approved: false
      }
      this.incService.addIncludedInPrice(query).then((data) => {
        this.includedInPrice.push(data);
      });
    }

    deleteServiceType(st) {
      this.serviceTypes.splice(this.serviceTypes.indexOf(st), 1);
      this.sService.deleteServiceType(st._id);
    }

    editServiceType(st) {
      this.sService.editServiceType(st);
    }

    addServiceType() {
      let query = {
        name: this.$scope.st.newSt
      }
      this.sService.addServiceType(query).then((data) => {
        this.serviceTypes.push(data);
      });
    }

  }

  angular.module('cateringApp.admin')
    .controller('AdminController', AdminController);
})();
