'use strict';

class NavbarController {
  //start-non-standard
  constructor(Auth, $state, $scope) {
    this.isLoggedIn = Auth.isLoggedIn;
    this.isAdmin = Auth.isAdmin;
    this.isManager = Auth.isManager;
    this.isCaterer = Auth.isCaterer;
    this.isUser = Auth.isUser;
    this.getCurrentUser = Auth.getCurrentUser;
    this.user = this.getCurrentUser();
    this.$state = $state;
    this.$scope = $scope;

    $scope.eventParam = {
      active: false,
      past: false
    };
    //console.log(this.user);

    $scope.$watchCollection(() => {
      return $state.params;
    }, () => {
      console.log($state.params)
      if ($state.params && $state.params.time === 'active') {
        $scope.eventParam.active = true;
        $scope.eventParam.past = false;
      } else if ($state.params && $state.params.time === 'past') {
        $scope.eventParam.active = false;
        $scope.eventParam.past = true;
      } else {
        $scope.eventParam.active = false;
        $scope.eventParam.past = false;
      }
    });

  }

}

angular.module('cateringApp')
  .controller('NavbarController', NavbarController);
