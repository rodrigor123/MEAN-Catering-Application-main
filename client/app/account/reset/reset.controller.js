'use strict';

class ResetController {
  constructor(Auth, $state) {
    this.user = {};
    this.errors = {};
    this.submitted = false;

    this.Auth = Auth;
    this.$state = $state;
  }

  reset(form) {
    this.submitted = true;

    if (form.$valid) {
      this.Auth.reset({
        email: this.user.email
      })
      .then(() => {
        this.$state.go('login');
      })
      .catch(err => {
          this.errors.other = err.message;
      });
    }
  }
}

angular.module('cateringApp')
  .controller('ResetController', ResetController);
