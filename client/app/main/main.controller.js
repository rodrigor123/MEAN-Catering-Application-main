'use strict';

(function() {

  class MainController {

    constructor($http, $scope, socket, $location, $uibModal) {
      this.$http = $http;
      this.socket = socket;
      this.awesomeThings = [];
      this.$location = $location;
      this.$uibModal = $uibModal;

      $scope.slides = [
        {
          image: '/assets/images/0.jpg',
          text: 'Best restaurants near',
          id: '0'
        },{
          image: '/assets/images/1.jpg',
          text: 'Best restaurants near',
          id: '1'
        },{
          image: '/assets/images/2.jpg',
          text: 'Best restaurants near',
          id: '2'
        },{
          image: '/assets/images/3.jpg',
          text: 'Best restaurants near',
          id: '3'
        }
        //,{
        //  image: '/assets/images/4.jpg',
        //  text: 'Best restaurants near',
        //  id: '4'
        //}
      ]

      $scope.$on('$destroy', function() {
        socket.unsyncUpdates('thing');
      });
    }

    $onInit() {

      var host_name = this.$location.host();
      if(host_name != 'app.cateringninja.com') {
         var modalInstance = this.$uibModal.open({
           templateUrl: 'myModalContent.html',
           backdrop: 'static',
           controller: 'ModalInstanceCtrl',
           controllerAs: '$ctrl',
           size: 'sm'
         });
       }else {

       }

      this.$http.get('/api/things')
        .then(response => {
          this.awesomeThings = response.data;
          this.socket.syncUpdates('thing', this.awesomeThings);
        });
    }

    addThing() {
      if (this.newThing) {
        this.$http.post('/api/things', {
          name: this.newThing
        });
        this.newThing = '';
      }
    }

    deleteThing(thing) {
      this.$http.delete('/api/things/' + thing._id);
    }
  }

  angular.module('cateringApp')
    .component('main', {
      templateUrl: 'app/main/main.html',
      controller: MainController
    });
})();


angular.module('cateringApp').controller('ModalInstanceCtrl', function ($uibModalInstance) {
  var $ctrl = this;
  $ctrl.alert = false;

  $ctrl.ok = function () {
    if($ctrl.pass == 'ninja3141')
      $uibModalInstance.close();
    else{
      $ctrl.alert = true;
      // return;
    }

  };
});
