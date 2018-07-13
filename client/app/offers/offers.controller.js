'use strict';

class OffersController {
  constructor($http, $scope, $rootScope, socket, Auth, $cookies, IncludedInPriceService, EventsService) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$cookies = $cookies;
    this.socket = socket;
    this.verifyCard = false;
    this.offerId = '';

    this.isLoggedIn = Auth.isLoggedIn;
    this.getCurrentUser = Auth.getCurrentUser;
    this.user = this.getCurrentUser();

    this.EventsService = EventsService;
    this.incService = IncludedInPriceService;

    this.$scope.includedInPrice = this.incService.getIncludedInPrice().then((data)=> {
      this.$scope.includedInPrice = data;
    });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('offer');
    });

    $rootScope.$on('eventActive', (eventId) => {
      this.init(eventId);
    });

    this.isReadyForPayment = false;

    $scope.saveCustomer = this.saveCustomer.bind(this);

    this.$scope.stripe = {};
  }

  init(eventId) {
    this.eventId = this.$scope.eventId =  this.$rootScope.eventActive || this.$cookies.get('eventActive');
    this.event = this.EventsService.getEventById(this.eventId).then((data) => {
      this.event = this.$scope.event = data;
      this.$scope.event.includedInPrice = this.convertIncludedInPrice(this.$scope.event.includedInPrice);
      this.$scope.offers = this.getOffersList();      
    });
  }

  //delete(offer) {
  //  let url = '/api/offers/' + offer._id;
  //
  //  this.$http.delete(url, offer)
  //    .then(response => {
  //    this.getOffersList();
  //  })
  //  .catch(err => {
  //      this.errors.other = err.message;
  //  })
  //}

  convertIncludedInPrice(array) {
    let cnt = [];
    _.each(this.$scope.includedInPrice, (item, j) => {
      if (_.indexOf(array, item._id) > -1) {
        cnt.push(item);
      }
    });
    return cnt;
  }

  prepareOffers() {
    let acceptedIndex = -1;
    let offers = _.filter(this.$scope.offers, (offer, i) => {
      //if (offer.status == 'accepted' || offer.status == 'confirmed') acceptedIndex = i;
      //if (this.event.status !== 'accepted' && this.event.status !== 'confirmed') {
      if (this.event.status !== 'confirmed') {
        if (offer.status == 'cancelled') offer.drafted = true;
        if (offer.invoice) {
          offer.priceWithCounter = offer.invoice.total;
        } else if (offer.counter) {
          offer.priceWithCounter = offer.counter * this.event.people;
          //offer.priceWithCounter = offer.pricePerPerson * this.event.people - offer.counter;
        } else {
          offer.priceWithCounter = offer.pricePerPerson * this.event.people;
        }
        offer.includedInPrice = this.convertIncludedInPrice(offer.includedInPrice);

        this.$http.get('/api/users/' + offer.catererId).then(response => {
          offer.caterer = response.data;
          this.$rootScope.$broadcast('imageLoaded');
        })
        .catch(err => {
          this.errors = err.message;
        });
        return offer;
      }

      //if (this.event.status == 'accepted') return offer.status == 'accepted';
      if (this.event.status == 'confirmed') return offer.status == 'confirmed';
    });

    this.$scope.offers = offers;

    //if (acceptedIndex > -1) {
    //  _.each(this.$scope.offers, (offer, i) => {
    //    if (i !== acceptedIndex) this.$scope.offers[i].drafted = true;
    //  });
    //}
  }

  decline(id) {
    if (this.user.role = 'user') {
      this.$http.post('/api/offers/' + id + '/decline', {status: 'declined'}).then(response => {
        //set visual state
        _.each(this.$scope.offers, (item, i) => {
          if (item._id == id) {
            this.$scope.offers[i].drafted = true;
            this.$scope.offers[i].status = 'declined';
          }
        });
        this.socket.syncUpdates('offer', this.$scope.offers);
      });
    }
  }

  accept(id) {  // by customer    
    if (this.user.role = 'user') {
      if (!this.user.payableAccountId) {
        this.offerId = id;
        this.verifyCard = true;
      }else {
        this.verifyCard = false;

        this.$http.post('/api/offers/' + id + '/accept', {status: 'accepted', eventId: this.eventId, dateAccepted: new Date() }).then(response => {
          //set visual state
          _.each(this.$scope.offers, (item, i) => {
            this.$scope.offers[i].drafted = true;
            if (item._id == id) {
              this.$scope.offers[i].drafted = false;
              this.$scope.offers[i].status = 'accepted';
              this.$rootScope.$broadcast('eventUpdated');
            }
          });
          this.socket.syncUpdates('offer', this.$scope.offers);
        });
      }      
    }
  }

  saveCustomer(status, response) {    
    if(response.error){
      this.$scope.stripe.error = response.error;
      return;
    }

    this.$scope.stripe.error = false;
    let token = response.id;    
    this.bindCard(token).then(result => {
      this.user.payableAccountId = result.data.id;

      this.$http.post(`/api/users/${this.user._id}`, {
        payableAccountId: result.data.id
      });

      this.accept(this.offerId);
    });
  }

  bindCard(token) {
    return this.$http.post('/api/payments/card/verify', {
      card: token,
      description: `Verified credit card for ${this.user.firstname} ${this.user.lastname} <${this.user.email}>`,
      email: this.user.email
    });
  }

  getOffersList() {
    this.$http.post('/api/offers', { eventId: this.eventId }).then(response => {
      this.$scope.offers = response.data;
      this.prepareOffers();
      this.socket.syncUpdates('offer', this.$scope.offers);
    });
  }

  auth(offer) {
    this.$http.post('/api/payments/card/auth', {
      offerId: offer._id
    }).then(response => {
      offer.paymentStatus = response.data.paymentStatus;
    });
  }

  capture(offer) {
    this.$http.post('/api/payments/card/capture', {
      offerId: offer._id
    }).then(response => {
      offer.paymentStatus = response.data.paymentStatus;
    });
  }

}

angular.module('cateringApp')
  .controller('OffersController', OffersController);

