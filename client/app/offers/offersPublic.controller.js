'use strict';

class OffersPublicController {
  constructor($http, $scope, $rootScope, socket, Auth, $state, $cookies, OffersService, EventsService, IncludedInPriceService, PaymentService) {
    this.errors = {};
    this.submitted = false;
    this.saved = false;
    this.sent = false;
    this.payments = PaymentService;

    this.Auth = Auth;
    this.$state = $state;
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.socket = socket;

    this.getCurrentUser = Auth.getCurrentUser;
    this.user = this.getCurrentUser();

    this.incService = IncludedInPriceService;
    this.$scope.includedInPrice = [];
    this.$scope.fm = {};
    this.$scope.offer = {};
    this.id = this.$state.params.id;
    this.$scope.isPast = false;
    this.eventId =  $rootScope.eventActive || $cookies.get('eventActive');
    this.event = {};

    this.incService.getIncludedInPrice().then((data)=> {
      this.$scope.includedInPrice = data;
    })
    .then(() => {
      return OffersService.getOfferById(this.id);
    })
    .then((offer) => {
      this.$scope.fm = offer;
      this.$scope.offer = offer;
      this.$scope.offer.includedInPrice = this.convertIncludedInPrice(this.$scope.offer.includedInPrice);
      this.eventId = this.$scope.offer.eventId;
    })
    .then(() => {
      return this.$http.get('/api/users/' + this.$scope.offer.catererId);
    })
    .then((caterer) => {
      this.$scope.offer.caterer = caterer.data;
      this.$rootScope.$broadcast('imageLoaded');
    })
    .then(() => {
      return EventsService.getEventById(this.eventId);
    })
    .then((event) => {
      this.event = event;
      this.event.includedInPrice = this.convertIncludedInPrice(this.event.includedInPrice);
      if (Date.parse(this.event.date) < Date.parse(new Date())) this.$scope.isPast = true;
    });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('event');
    });

  }

  convertIncludedInPrice(array) {
    let cnt = [];
    _.each(this.$scope.includedInPrice, (item, j) => {
      if (_.indexOf(array, item._id) > -1) {
        cnt.push(item);
      }
    });
    return cnt;
  }

  decline(id) {
    if (this.user.role = 'user') {
      this.$http.post('/api/offers/' + id + '/decline', {status: 'declined'}).then(response => {
        this.$scope.offer.status = 'declined';
        this.socket.syncUpdates('offer', this.$scope.offers);
      });
    }
  }

  accept(id) {  // by customer
    if (this.user.role = 'user') {
      this.$http.post('/api/offers/' + id + '/accept', {status: 'accepted', eventId: this.eventId, dateAccepted: new Date() }).then(response => {
        //set visual state
        this.$scope.offer.status = 'accepted';
        this.socket.syncUpdates('offer', this.$scope.offers);
      });
    }
  }

  backToList() {
    this.$state.go('events', { time: 'active' });
  }
}

angular.module('cateringApp')
  .controller('OffersPublicController', OffersPublicController);

