'use strict';

class TemplatesController {
  constructor($http, $scope, $rootScope, socket, Auth, $timeout) {
    this.$scope = $scope;
    this.saved = false;
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.socket = socket;
    this.$timeout = $timeout;

    this.isLoggedIn = Auth.isLoggedIn;
    this.getCurrentUser = Auth.getCurrentUser;
    this.user = this.getCurrentUser();

    this.$scope.tfm = {};
    this.$scope.checkForExistence = false;
    this.$scope.templates = this.getTemplatesList();

    $scope.$watch('tfm.name', () => {
      this.check();
    });

    $scope.$watch('fm.offerDescription', () => {
       if ($scope.fm && $scope.fm.offerDescription)  $scope.tfm.description = $scope.fm.offerDescription;
    });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('tpl');
    });
  }

  delete(tpl) {
    let url = '/api/templates/' + tpl._id;

    this.$http.delete(url, tpl)
      .then(response => {
      this.getTemplatesList();
    })
    .catch(err => {
      this.errors.other = err.message;
    })
  }

  check() {
    let cnt = 0;
    _.each(this.$scope.templates, (o) => {
      if (o.name === this.$scope.tfm.name) {
        cnt++;
      }
    });

    if (this.$scope.tfm.name && cnt > 0) this.$scope.checkForExistence = true;
    else this.$scope.checkForExistence = false;
  }

  createTpl(tpl) {
    let query = tpl,
      root = this;
    query.userId = this.user._id;

    if (query._id) delete query._id;

    this.$http.post('/api/templates/new', query).then(response => {
      this.$scope.templates = this.getTemplatesList();
      this.saved = true;
      this.$scope.tfm = {};
      this.$timeout(function() {
        root.saved = false;
      }, 3000);
      this.socket.syncUpdates('tpl', this.$scope.templates);
    });
  }

  editTpl(tpl) {
    let query = tpl;
    query.userId = this.user._id;
    this.$http.post('/api/templates/' + tpl._id, tpl).then(response => {
      tpl.saved = true;
      this.$timeout(function() {
        tpl.saved = false;
      }, 3000);
      this.socket.syncUpdates('tpl', this.$scope.templates);
    });
  }

  populateTpl() {
    if (this.$scope.templateSelected) {
      _.find(this.$scope.templates, (o) => {
        if (o._id === this.$scope.templateSelected._id) {
          this.$scope.tfm.name = o.name;
          this.$scope.tfm.description = o.description;
          return o;
        }
      });
    }
    //populate to offer
    this.populateToOffer();
  }

  populateToOffer() {
    //console.log('scope', this.$scope);
    this.$scope.fm.offerDescription = this.$scope.tfm.description;
  }

  getTemplatesList() {
    this.$http.post('/api/templates', { userId: this.user._id }).then(response => {
      this.$scope.templates = response.data;
      this.socket.syncUpdates('tpl', this.$scope.templates);
    });
  }
}

angular.module('cateringApp')
  .controller('TemplatesController', TemplatesController);

