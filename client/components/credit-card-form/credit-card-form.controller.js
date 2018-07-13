'use strict';

class CreditCardController {

  constructor($scope, $http, $window, $location, $state) {
    this.$http = $http;
    this.$scope = $scope;
    this.$location = $location;
    this.$state = $state;
    this.error = null;
    this.ccupdateSuccess = false;

    $scope.stripeCallback = this.stripeCallback.bind(this);

    $window.Stripe.setPublishableKey('pk_test_0EFB2Y1WvIYGIIUsAQJ42DVD');
    // this.$http.get('/api/payments/card/token').then((response) => {
    //   $window.Stripe.setPublishableKey(response.data.checkoutToken);
    // });

  }

  checkout(user, amount, description) {
    return this.$http.post('/api/payments/card/checkout', {
      amount: amount, // amount should be in cents
      customer: user.payableAccountId,
      currency: "usd",
      description: description || "Sample Checkout"
    }).then((response) => {
      console.log(response);
      alert('Check out has been successful')
    });
  }

  bindCard(token) {
    return this.$http.post('/api/payments/card/verify', {
      card: token,
      description: `Verified credit card for ${this.user.firstname} ${this.user.lastname} <${this.user.email}>`,
      email: this.user.email
    });
  }

  updateCard(token){
    return this.$http.post('/api/payments/card/update', {
      id: this.user.payableAccountId,
      card: token,
      description: `Updated credit card for ${this.user.firstname} ${this.user.lastname} <${this.user.email}>`,
      email: this.user.email
    });
  }

  stripeCallback(code, result) {

    if (result.error) {
      this.error = result.error.message ? result.error.message : result.error;
    } else {
      this.error = null;

      if (this.verifier) {
        this.bindCard(result.id).then(result => {
          this.user.payableAccountId = result.data.id;

          this.$http.post(`/api/users/${this.user._id}`, {
            payableAccountId: result.data.id
          });

          let eventModel = this.event,
          url = '/api/events/' + eventModel._id;

          eventModel.showToCaterers = true;
          eventModel.sentTo = eventModel.selectedCaterers;
          eventModel.status = 'sent';
          eventModel.userId = this.user._id;
          eventModel.createDate = new Date();

          if (eventModel.status == 'sent') eventModel.isUpdated = true;

          if (eventModel) {
              this.$http.post(url, eventModel)
                .then(response => {
                  //this.$state.go('events');
                })
                .catch(err => {
                  this.errors.other = err.message;
                });
          }
          this.$state.go('events', { time: 'active' });
        });
      }

      if(this.ccupdate){
        this.updateCard(result.id).then(result => {
          //this.$state.go('customer-profile');
          this.ccupdateSuccess = true;
        })                
        .catch(err => {
            this.errors.other = err.message;
        });
      }

    }
  }

}

angular.module('cateringApp')
  .controller('CreditCardController', CreditCardController);
