'use strict';

angular.module('cateringApp')
  .factory('PaymentService', function($http, $q, $window) {
    return {
      verifyAddress(address) {
        return $http.post('/api/payments/taxes/address/verify', address).then((result) => {
          result = JSON.parse(result.data);
          let address = {};
          if (result.ErrNumber === "0" && !result.ErrDescription) {
            for (let k in result) {
              if (['ErrNumber', 'ErrDescription'].indexOf(k) === -1) {
                address[k] = result[k];
              }
            }
            return $q.resolve(address);
          }
          return $q.reject(result);
        });
      },
      lookupTaxes(user, event, basePrice) {
        return $http.post('/api/payments/taxes/lookup', {
          customerId: user._id,
          destination: event.address,
          origin: event.address,
          cartItems: [
            {
              Index: 0,
              ItemID: event._id,
              TIC: '00000',
              Price: basePrice,
              Qty: 1
            }
          ],
          deliveredBySeller: true
        }).then((result) => {
          result = JSON.parse(result.data);
          if (result.ResponseType === 3) {
            return $q.resolve(result.CartItemsResponse[0].TaxAmount);
          }
          return $q.reject(result);
        });
      },
      dwollaAuth(authCode) {
        if (!authCode) {
          return $http.get('/api/payments/dwolla/startAuth?redirect=/dwolla').then((response) => {
            $window.open(response.data.authUrl, '_self');
          });
        } else {
          this.isAuth = true;
          return $http.get('/api/payments/dwolla/endAuth?redirect=/dwolla&authCode=' + authCode).then((response) => {
            return JSON.parse(response.data);
          });
        }
      },
      dwollaLogin() {
          return $http.get('/api/payments/dwolla/loginUrl').then((response) => {
            $window.open(response.data.loginUrl, '_blank');
          });
      }

    }

  });
