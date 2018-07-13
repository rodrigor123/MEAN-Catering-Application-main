'use strict';


class LoginController {
  constructor(Auth, $state) {
    this.user = {};
    this.errors = {};
    this.submitted = false;

    this.Auth = Auth;
    this.$state = $state;
  }

  login(form) {
    this.submitted = true;

    if (form.$valid) {

      this.Auth.login({
          email: this.user.email,
          password: this.user.password
        })
        .then(() => {
          // Logged in, redirect to home
          return this.Auth.getCurrentUser();
        })
        .then((user) => {
          // Logged in, redirect to home
          if (user.role === 'admin') this.$state.go('admin');
          else this.$state.go('events', { time: 'active' });
          })
        .catch(err => {
          this.errors.other = err.message;
        });
    }
  }
}

angular.module('cateringApp')
  .controller('LoginController', LoginController);
