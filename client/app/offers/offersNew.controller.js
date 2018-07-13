'use strict';

class OffersNewController {
  constructor($http, $scope, $rootScope, socket, Auth, $state, $cookies, EventsService, IncludedInPriceService, PaymentService, ServiceTypesService) {
    this.errors = {};
    this.submitted = false;
    this.saved = false;
    this.sent = false;
    this.payments = PaymentService;

    this.Auth = Auth;
    this.$state = $state;
    this.$scope = $scope;
    this.$http = $http;
    this.socket = socket;

    this.getCurrentUser = Auth.getCurrentUser;
    this.isLoggedIn = Auth.isLoggedIn;
    this.user = this.getCurrentUser();
    this.incService = IncludedInPriceService;
    this.serService = ServiceTypesService;
    this.$scope.fm = {};


    this.$scope.isPast = false;

    this.eventId =  $rootScope.eventActive || $cookies.get('eventActive');
    this.event = EventsService.getEventById(this.eventId).then((data) => {
      this.event = data;
      if (Date.parse(this.event.date) < Date.parse(new Date())) {
        this.$scope.isPast = true;
      }
      this.$scope.includedInPrice = this.incService.getIncludedInPrice().then((data)=> {
        this.$scope.includedInPrice = _.map(data, (item, i) => {
          if (_.indexOf(this.event.includedInPrice, item._id) < 0) {
            item.checked = false;
          } else {
            item.checked = true;
          }
          return item;
        });
      });
      this.$scope.fm.includedInPrice = this.event.includedInPrice;
      this.$scope.fm.pricePerPerson = this.event.pricePerPerson;
      this.$scope.fm.people = this.event.people;
      this.$scope.fm.priceTotal = this.$scope.fm.pricePerPerson * this.$scope.fm.people;

      this.$scope.serviceTypes = this.serService.getServiceTypes().then((data)=> {
        this.$scope.serviceTypes = _.map(data, (item, i) => {
          if (_.indexOf(this.event.serviceTypes, item._id) < 0) {
            item.checked = false;
          } else {
            item.checked = true;
          }
          return item;
        });
      });

      this.$scope.fm.serviceTypes = this.event.serviceTypes;
    });

    this.$scope.fm.contactInfo = this.user.contactInfo;
    this.$scope.fm.eventId = this.eventId;

    // Watch & Update SubTotal
    $scope.$watch('fm.counter', updateSubTotal);

    function updateSubTotal() {
      $scope.fm.counterTotal = $scope.fm.counter * $scope.fm.people;
    }

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('offer');
    });

  }


  cancelChanges() {
    this.$state.go('events', { time: 'active' });
  }

  sendRequest(form) {

      let offerModel = this.$scope.fm;
      offerModel.catererId = this.user._id;
      offerModel.catererName = this.user.companyName || this.user.name;
      offerModel.date = new Date();
      offerModel.status = 'sent';
      if (offerModel) {

        let total = this.event.pricePerPerson * this.event.people;
        if (offerModel.counter) {
          total = offerModel.counter * this.event.people;
          //total -= offerModel.counter; changed to correctly add total of counter offer
        }
        total = +total.toFixed(2);

        this.payments.lookupTaxes(this.user, this.event, total).then(tax => {

          // Add Tip count - Marcin.
          var tip = 0;
          if(this.event.tip){
            if(this.event.tipType == '%'){
              tip = this.event.tip/100 * (total + tax);
            }else if(this.event.tipType == '$'){
              tip = this.event.tip;
            }
          }else {
            tip = 0;
          }

          offerModel.invoice = {
            pricePerPerson: this.event.pricePerPerson,
            people: this.event.people,
            counter: offerModel.counter || 0,
            service: total,
            tax: tax,
            tip: tip,
            total: total + tax + tip,
            commission: this.user.commission
          };

          this.$http.post('/api/offers/new', offerModel).then(response => {
            this.sent = true;
            //this.$state.go('events');
            //this.$scope.fm = {};
          })
            .catch(err => {
              this.errors.other = err.message;
            });
        });
      }

  }

  backToList() {
    this.$state.go('events', { time: 'active' });
  }

  saveDraft(form, redirect=true) {
    let offerModel = this.$scope.fm;
    offerModel.catererId = this.user._id;
    offerModel.catererName = this.user.companyName || this.user.name;
    offerModel.date = new Date();
    offerModel.status = 'draft';

    if (offerModel) {
        let total = this.event.pricePerPerson * this.event.people;
        if (offerModel.counter) {
          total = offerModel.counter * this.event.people;
        }
        total = +total.toFixed(2);

        // Add Tip count - Marcin.
        if(this.event.tipType == '%'){
          total = total + this.event.tip/100 * total;
        }else if(this.event.tipType == '$'){
          total = total + this.event.tip;
        }

        this.payments.lookupTaxes(this.user, this.event, total).then(tax => {
          offerModel.invoice = {
            pricePerPerson: this.event.pricePerPerson,
            people: this.event.people,
            counter: offerModel.counter || 0,
            service: total,
            tax: tax,
            total: total + tax,
            commission: this.user.commission
          };

          return this.$http.post('/api/offers/new', offerModel).then(response => {
            this.saved = true;
          })
            .catch(err => {
              this.errors.other = err.message;
            });
        });
    }
  }
}

angular.module('cateringApp')
  .controller('OffersNewController', OffersNewController);

