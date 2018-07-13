'use strict';

class EventsController {
  constructor($http, $scope, $rootScope, socket, Auth, $state, $cookies, $sce, OffersService, $interval, $filter) {

    var root = this;
    this.errors = {};
    this.submitted = false;
    this.saved = false;
    this.sent = false;

    this.Auth = Auth;
    this.$state = $state;
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$sce = $sce;
    this.$cookies = $cookies;
    this.socket = socket;
    this.OffersService = OffersService;
    this.getCurrentUser = Auth.getCurrentUser;
    this.user = this.getCurrentUser().$promise;
    this.isLoggedIn = Auth.isLoggedIn;
    this.$scope.eventActive = null;
    this.$scope.events = [];
    this.$scope.displayed = [];
    this.$scope.isInvoiceMode = false;
    this.$scope.eventForInvoice = null;
    this.$scope.loading = false;

    this.$scope.filter = {
      dateFilter: 'All',
      newEvents: false,
      confirmedEvents: false
    }

    let now = new Date();
    $scope.start24 = Date.parse(now) - (24 * 60 * 60 * 1000);
    $scope.start1 = Date.parse(now) - (60 * 60 * 1000);

    this.getCurrentUser().$promise.then((user) => {
      this.user = $scope.user = user;     
      if (user.role == 'caterer') {
        $scope.query = {
          showToCaterers: true,
          catererId: user._id,
          radius: user.radius,
          catererAddress: user.address
        }
        if (user.foodTypes) $scope.query.foodTypes = user.foodTypes;
        if (user.serviceTypes) $scope.query.serviceTypes = user.serviceTypes;
        if (user.veganOffers) $scope.query.veganOffers = true;
        else $scope.query.veganOffers = false;
      } else {
        $scope.query = {
          userId: user._id
        }
      }

      if (this.$state.params.time === 'active' || !this.$state.params.time) $scope.query.showFuture = true;
      else if (this.$state.params.time === 'past') $scope.query.showPast = true;

    });

    this.pipe = function(tableState) {
      $scope.loading = true;

      if ($scope.query) {
        $scope.tableState = (angular.isObject(tableState) && tableState ? tableState : $scope.tableState);
        $http.post('/api/events/dataset', $scope.query)
        .then(response => {
          let events = response.data;
          $scope.newEventsCount = 0;
          $scope.confirmedEventsCount = 0;

          // console.log('events1', events);

          _.each(events, (event, i) => {
            if ($scope.user.role == 'caterer') {
              if ((_.indexOf(event.rejectedBy, $scope.user._id) >= 0) ||
                (event.status == 'confirmed' && event.confirmedBy !== $scope.user._id) ||
                ($scope.user.minprice && event.pricePerPerson < $scope.user.minprice )) {
                events[i].drafted = true;
              }
            }
            let offers = _.filter(event.offers, (offer) => {
              return (offer.status !== 'declined' && offer.status !== 'cancelled');
            }),
            offersNumber = offers ? offers.length : 0;

            if ($scope.user.role == 'caterer') {
              let offerUrl = (offers.length ? '/offers/' + offers[0]._id : '/offers/new');

              events[i].offerUrl = offerUrl;
              events[i].offerStatus = (offers.length ? offers[0].status : null);
              events[i].offersNumber = offersNumber;
            } else {
              let offersInfo = '';
              _.each(offers, (offer, j) => {
                let status = offer.status;
                offersInfo += '<div>' + offer.catererName + ' <span class="label label-info">' + status + '</span></div><hr class="popover-divider" />';
                events[i].offersInfo = $sce.trustAsHtml(offersInfo);
              });
              events[i].offersNumber = offersNumber;
            }
          });

          //$scope.events = events;

          $scope.events = _.filter(events, (o) => {           
            if (!o.drafted) {

              if (o.status == 'confirmed') $scope.confirmedEventsCount++;

              if ($scope.filter.dateFilter == '24') {
                if (Date.parse(o.createDate) > $scope.start24) {
                  $scope.newEventsCount++;
                }
              } else if ($scope.filter.dateFilter == '1') {
                if (Date.parse(o.createDate) > $scope.start1) {
                  $scope.newEventsCount++;
                }
              }
              return o;
            }
          });

          // console.log('events2', $scope.events);

          let filtered = $scope.tableState.search.predicateObject ? $filter('filter')($scope.events, $scope.tableState.search.predicateObject) : $scope.events,
              start = $scope.tableState.pagination.start,
              number = $scope.tableState.pagination.number;

          if ($scope.tableState.sort.predicate) {
            filtered = $filter('orderBy')(filtered, $scope.tableState.sort.predicate, $scope.tableState.sort.reverse);
          }

          if($scope.user.role == 'caterer') {
            filtered = _.filter(filtered, (event) => {
                return event.distance < $scope.user.radius;
            })
          }

          $scope.displayed = filtered.slice(start, start + number);         
          $scope.tableState.pagination.numberOfPages = Math.ceil(filtered.length / number);
          if ($rootScope.eventActive) $rootScope.$broadcast('eventActive', $rootScope.eventActive);

          $scope.loading = false;
        });
      }
    }

    $scope.$watchGroup(['filter.dateFilter', 'filter.newEvents', 'filter.confirmedEvents'], () => {
      let now = new Date();
        $scope.start24 = Date.parse(now) - (24 * 60 * 60 * 1000);
        $scope.start1 = Date.parse(now) - (60 * 60 * 1000);

      if ($scope.query) {
        if ($scope.filter.newEvents) {
          if ($scope.filter.dateFilter == 'All') {
            delete $scope.query.createDate;
          } else if ($scope.filter.dateFilter == '24') {
            $scope.query.createDate = $scope.start24;
          } else if ($scope.filter.dateFilter == '1') {
            $scope.query.createDate = $scope.start1;
          }
        } else {
          delete $scope.query.createDate;
        }

        if ($scope.filter.confirmedEvents) {
          if ($scope.filter.dateFilter == 'All') {
            delete $scope.query.confirmedDate;
            $scope.query.status = 'confirmed';
          } else if ($scope.filter.dateFilter == '24') {
            $scope.query.confirmedDate = $scope.start24;
            $scope.query.status = 'confirmed';
          } else if ($scope.filter.dateFilter == '1') {
            $scope.query.confirmedDate = $scope.start1;
            $scope.query.status = 'confirmed';
          }
        } else {
          delete $scope.query.confirmedDate;
          delete $scope.query.status;
        }
        root.pipe();
      }
    });

    var sync = $interval(root.pipe, (1000 * 60));

    $scope.$on('eventUpdated', () => {
      root.pipe();
    });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('event');
      socket.unsyncUpdates('offer');
      $interval.cancel(sync);
    });
  }

  delete(event) {
    let url = '/api/events/' + event._id;
    _.each(this.$scope.events, (item, i) => {
      if (item._id == event._id) {
        this.$scope.events[i].drafted = true;
      }
    });
    this.$http.delete(url, event)
      .then(response => {
        this.pipe();
      })
    .catch(err => {
        this.errors.other = err.message;
    })
  }

  cancel(id) {
    if (this.user.role = 'user') {
      _.each(this.$scope.events, (item, i) => {
        if (item._id == id) {
          this.$scope.events[i].drafted = true;
          this.$scope.events[i].status = 'cancelled';
        }
      });
      this.$http.post('/api/events/' + id + '/cancel', {status: 'cancelled'}).then(response => {
        this.pipe();
        this.socket.syncUpdates('offer', this.$scope.offers);
      });
    }
  }

  decline(id) {        //as caterer
    if (this.user.role = 'caterer') {
      this.$http.post('/api/events/' + id + '/decline', {rejectedBy: this.user._id}).then(response => {
        _.each(this.$scope.events, (item, i) => {
          if (item._id == id) {
            this.$scope.events[i].drafted = true;
          }
        });
        this.socket.syncUpdates('offer', this.$scope.offers);
      });
      this.$http.post('/api/offers/cancelAll', {eventId: id, catererId: this.user._id}).then(response => {
       //all offers are cancelled
      });
    }
  }

  prepareCatererEvents() {
    _.each(this.$scope.events, (event, i) => {
      if (_.indexOf(event.rejectedBy, this.user._id) >= 0 || event.status == "cancelled") {
        this.$scope.events[i].drafted = true;
      }

      this.$http.post('/api/offers', {eventId: event._id, catererId: this.user._id}).then(response => {
        let offerUrl = (response.data.length ? '/offers/' + response.data[0]._id : '/offers/new'),
            status = (response.data.length ? response.data[0].status : null),
            offersNumber = response.data.length;
        this.$scope.events[i].offerUrl = offerUrl;
        this.$scope.events[i].offerStatus = status;
        this.$scope.events[i].offersNumber = offersNumber;
        this.socket.syncUpdates('offer', this.$scope.events);
      });
    });
  }

  prepareUserEvents() {
    _.each(this.$scope.events, (event, i) => {
      if (event.status == "cancelled") {
        this.$scope.events[i].drafted = true;
      }
      this.$http.post('/api/offers', {eventId: event._id}).then(response => {
        let offersNumber = response.data.length,
          offersInfo = '';
        _.each(response.data, (offer, j) => {
          let status = offer.status;
          this.$http.get('/api/users/' + offer.catererId).then(res => {
            offersInfo += '<div>' + res.data.name + ' <span class="label label-info">' + status + '</span></div><hr class="popover-divider" />';
            this.$scope.events[i].offersInfo = this.$sce.trustAsHtml(offersInfo);
          });
        });
        this.$scope.events[i].offersNumber = offersNumber;
        this.socket.syncUpdates('offer', this.$scope.events);
      });
    });
  }

  getEventsList() {
    if (this.user.role == 'user') {
      this.$http.post('/api/events', {userId: this.user._id}).then(response => {
        this.$scope.events = response.data;
        this.prepareUserEvents();
        this.socket.syncUpdates('event', this.$scope.events);
      });
    } else if (this.user.role == 'caterer') {
      this.$http.post('/api/events', {showToCaterers: true, sentTo: this.user._id}).then(response => {
        this.$scope.events = response.data;
        this.prepareCatererEvents();
        this.socket.syncUpdates('event', this.$scope.events);
      });
    }
  }

  showInvoice($event, event) {
    this.$scope.isInvoiceMode = true;
    this.$scope.eventForInvoice = angular.copy(event);
    this.$scope.eventForInvoice.offer = this.$scope.eventForInvoice.offers.filter((offer) => {
      offer.invoice.subtotal = offer.invoice.people * offer.invoice.pricePerPerson;
      console.log('eventForInvoice', this.$scope.eventForInvoice);
      return offer.paymentStatus === 'paid' || offer.status === 'completed';
    })[0];

    if(!this.$scope.eventForInvoice.tip) {
      this.$scope.eventForInvoice.tip = 0;
    }

    $event.stopPropagation();
  }

  setActiveEvent(event) {
    this.$scope.isInvoiceMode = false;
    this.$scope.eventForInvoice = null;
    this.$scope.eventActive = event._id;
    this.$rootScope.eventActive = event._id;
    this.$cookies.put('eventActive', event._id);
    this.$rootScope.$broadcast('eventActive', event._id);
    if (this.user.role === 'user') {
      _.each(this.$scope.events, (item, i) => {
        this.$scope.events[i].active = false;
        if (item._id ==  event._id) {
          this.$scope.events[i].active = true;
        }
      });
    }
  }

}

angular.module('cateringApp')
  .controller('EventsController', EventsController);

