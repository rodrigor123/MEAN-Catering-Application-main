'use strict';

class OffersEditController {
  constructor($http, $scope, $rootScope, socket, Auth, $state, $cookies, OffersService, EventsService, IncludedInPriceService, PaymentService, ServiceTypesService) {
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
    this.user = this.getCurrentUser();

    this.incService = IncludedInPriceService;
    this.serService = ServiceTypesService;

    this.id = this.$state.params.id;
    this.$scope.fm = OffersService.getOfferById(this.id).then((data) => {
      this.$scope.fm = data;
      this.$scope.offer = data;
    });

    this.$scope.isPast = false;

    this.eventId =  $rootScope.eventActive || $cookies.get('eventActive');
    this.event = EventsService.getEventById(this.eventId).then((data) => {
      this.event = data;
      this.$scope.fm.people = this.event.people;
      this.$scope.fm.priceTotal = this.$scope.fm.pricePerPerson * this.$scope.fm.people;
      this.$scope.fm.counterTotal = this.$scope.fm.counter * this.$scope.fm.people;
      if (Date.parse(this.event.date) < Date.parse(new Date())) this.$scope.isPast = true;
    });

    // Watch & Update SubTotal
    $scope.$watch('fm.counter', updateSubTotal);

    function updateSubTotal() {
      $scope.fm.counterTotal = $scope.fm.counter * $scope.fm.people;
    }

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('event');
    });

    this.$scope.includedInPrice = this.incService.getIncludedInPrice().then((data)=> {
      this.$scope.includedInPrice = _.map(data, (item, i) => {
        if (_.indexOf(this.$scope.fm.includedInPrice, item._id) < 0) {
          item.checked = false;
        } else {
          item.checked = true;
        }
        return item;
      });
    });


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
  }

  confirm(id) {  //by caterer
    if (this.user.role = 'caterer') {

      if(!this.user.payableAccount) {
        /*let saving = this.saveDraft(form, false);
        if (saving) {
          saving.then(() => {
            this.$state.go('dwolla');
          });
        }

        if (offerModel) {

          return this.$http.put(url, offerModel)
            .then(response => {
              this.saved = true;
              if (redirect) {

              }
            })
          .catch(err => {
            this.errors.other = err.message;
          })
        }*/

        let offerModel = this.$scope.fm,
        url = '/api/offers/' + this.$scope.fm._id;

        offerModel.date = new Date();

        if(!offerModel.status) offerModel.status = 'draft';

        if (offerModel) {
            let total = offerModel.pricePerPerson * this.event.people;
            if (offerModel.counter) {
              total = offerModel.counter * this.event.people;
            }
            total = +total.toFixed(2);
            this.payments.lookupTaxes(this.user, this.event, total).then(tax => {
              offerModel.invoice = {
                pricePerPerson: this.event.pricePerPerson,
                people: this.event.people,
                counter: offerModel.counter || 0,
                service: total,
                tax: tax,
                total: total + tax
              };

              this.$http.put(url, offerModel).then(response => {
                this.saved = true;
                this.$state.go('dwolla',{offer: response.data});
              })
              .catch(err => {
                  this.errors.other = err.message;
              });
            });
        }
      }else{
        this.$http.post('/api/offers/' + id + '/confirm', {status: 'confirmed', eventId: this.eventId, userId: this.user._id, dateConfirmed: new Date() }).then(response => {
          //set visual state
          this.confirmed = true;
          this.$scope.fm.status = 'confirmed';
          //this.$state.go('events');
          this.socket.syncUpdates('offer', this.$scope.offers);
        });
      }
    }
  }
  cancel(id) {
    if (this.user.role = 'caterer') {
      this.$http.post('/api/offers/' + id + '/cancel', { eventId: this.eventId, status: 'cancelled'}).then(response => {
        //set visual state
        this.cancelled = true;
        this.$scope.fm.status = 'cancelled';
        //this.$state.go('events');
        this.socket.syncUpdates('offer', this.$scope.offers);
      });
    }
  }

  cancelChanges() {
    this.$state.go('events', { time: 'active' });
  }

  sendRequest(form) {

      let offerModel = this.$scope.fm;
      offerModel.catererId = this.user._id;
     // offerModel.catererName = this.user.companyName || this.user.name;
      offerModel.date = new Date();
      offerModel.status = 'sent';
      if (offerModel) {
        let total = offerModel.pricePerPerson * this.event.people;
        if (offerModel.counter) {
          total = offerModel.counter * this.event.people;
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
          }else{
            tip = 0;
          }

          offerModel.invoice = {
            pricePerPerson: this.event.pricePerPerson,
            people: this.event.people,
            counter: offerModel.counter || 0,
            service: total,
            tax: tax,
            tip: tip,
            total: total + tax + tip
          };

          this.$http.post('/api/offers/' + this.$scope.fm._id, offerModel).then(response => {
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
    let offerModel = this.$scope.fm,
    url = '/api/offers/' + this.$scope.fm._id;

    if(!offerModel.status) offerModel.status = 'draft';

    if (offerModel) {
      let total = offerModel.pricePerPerson * this.event.people;
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
          total: total + tax
        };

        return this.$http.put(url, offerModel).then(response => {
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
  .controller('OffersEditController', OffersEditController);

