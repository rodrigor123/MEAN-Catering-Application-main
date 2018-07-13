'use strict';

class DwollaController {
  constructor(authCode, $http, $state, $stateParams, $rootScope, Auth, PaymentService) {
    this.user = Auth.getCurrentUser();
    this.PaymentService = PaymentService;
    this.offer = $stateParams.offer;
    this.authCode = authCode;
    this.isAuth = false;

    if(!authCode){
      localStorage.setItem('SAVING_OFFER', JSON.stringify(this.offer));
    }

    // After Dwolla Auth
    if((!this.user.payableAccount || !this.user.dwollaTokens) && authCode){
      this.isAuth = true;

      PaymentService.dwollaAuth(authCode).then(response => {
        if (response) {
          if (this.user.role === 'admin') {
            console.log(response);
            $http.post(`/api/users/${this.user._id}`, {
              dwollaTokens: {
                access_token: response.access_token,
                refresh_token: response.refresh_token
              }
            }).then(() => {
              $state.go('admin');
            }).catch(() => $state.go('dwolla'));
            // $state.go('admin');
          } else {
            $http.post(`/api/users/${this.user._id}`, {
              payableAccount: {
                id: response.account_id,
                links: response._links
              }
            })
              .then(res => {
                let user = res.data;
                if (user.payableAccount) {
                  this.user.payableAccount = user.payableAccount;

                  let offerModel = JSON.parse(localStorage.getItem('SAVING_OFFER'));
                  offerModel.status = 'sent';

                  if (offerModel) {
                    $http.post('/api/offers/' + offerModel._id, offerModel).then(response => {
                      $state.go('events', { time: 'active' });
                    })
                      .catch(err => {
                        //this.errors.other = err.message;
                      })
                  }
                }
              })
              .catch(() => $state.go('dwolla'));
          }

        }
      });
    }

  }

  toDwollaAuth(){
      return this.PaymentService.dwollaAuth(this.authCode);
  }
}

angular.module('cateringApp')
  .controller('DwollaController', DwollaController);
