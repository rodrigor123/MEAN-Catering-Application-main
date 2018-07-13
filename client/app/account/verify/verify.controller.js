'use strict';

class VerifyController {
  constructor(Auth, $state, $timeout) {
    this.user = {};
    this.errors = {};
    this.submitted = false;

    this.Auth = Auth;
    this.$state = $state;
    this.$timeout = $timeout;

    this.verify();
  }

  verify() {
    this.Auth.verify(this.$state.params.id)
    .then((user) => {
      // Logged in, redirect to home
      let root = this;
      this.$timeout(function() {
        if (user.role === 'caterer') {
          root.$state.go('caterer-profile');
        } else {
          root.$state.go('events', { time: 'active' });
        }
      }, 2000);
    })
    .catch(err => {
        this.errors.other = err.message;
    });
  }
}

angular.module('cateringApp')
  .controller('VerifyController', VerifyController);
