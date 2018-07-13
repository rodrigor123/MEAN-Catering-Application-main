'use strict';

class EventsAdminController {
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
    this.$scope.adminEvents = [];
    this.$scope.displayed_events = [];
    this.$scope.isInvoiceMode = false;
    this.$scope.eventForInvoice = null;

    this.$scope.eventAdminFilter = {
      dateFilter: 'All',
      newEvents: false,
      confirmedEvents: false
    }

    let now = new Date();
    $scope.start24 = Date.parse(now) - (24 * 60 * 60 * 1000);
    $scope.start1 = Date.parse(now) - (60 * 60 * 1000);

    this.getCurrentUser().$promise.then((user) => {
      this.user = $scope.user = user;
      if (user.role == 'admin') {
        $scope.eventAdminQuery = { userId: user._id };
      }
    });


    this.eventsPipe = function(eventsTableState) {      
      if ($scope.eventAdminQuery) {
        $scope.eventsTableState = (angular.isObject(eventsTableState) && eventsTableState ? eventsTableState : $scope.eventsTableState);
        $http.post('/api/events/adminEvents', $scope.eventAdminQuery)
        .then(response => {
          let events = response.data;

          $scope.newEventsCount = 0;
          $scope.confirmedEventsCount = 0;

          // console.log('events1', events);

          _.each(events, (event, i) => {
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

          //$scope.adminEvents = events;

          $scope.adminEvents = _.filter(events, (o) => {
            if (!o.drafted) {

              if (o.status == 'confirmed') $scope.confirmedEventsCount++;

              if ($scope.eventAdminFilter.dateFilter == '24') {
                if (Date.parse(o.createDate) > $scope.start24) {
                  $scope.newEventsCount++;
                }
              } else if ($scope.eventAdminFilter.dateFilter == '1') {
                if (Date.parse(o.createDate) > $scope.start1) {
                  $scope.newEventsCount++;
                }
              }
              return o;
            }
          });
          
          // $scope.adminEvents = events;
          // console.log('events2', $scope.adminEvents);

          let filtered = $scope.eventsTableState.search.predicateObject ? $filter('filter')($scope.adminEvents, $scope.eventsTableState.search.predicateObject) : $scope.adminEvents,
              start = $scope.eventsTableState.pagination.start,
              number = $scope.eventsTableState.pagination.number;

          if ($scope.eventsTableState.sort.predicate) {
            filtered = $filter('orderBy')(filtered, $scope.eventsTableState.sort.predicate, $scope.eventsTableState.sort.reverse);
          }

          $scope.displayed_events = filtered.slice(start, start + number);
          _.each($scope.displayed_events, (event, i) => {
            $http.get('/api/users/' + event.userId).then(res => {
              $scope.displayed_events[i].userName = res.data.firstname+' '+res.data.lastname;
            });
          })

          $scope.eventsTableState.pagination.numberOfPages = Math.ceil(filtered.length / number);
          if ($rootScope.eventActive) $rootScope.$broadcast('eventActive', $rootScope.eventActive);
        });
      }
    }

    $scope.$watchGroup(['eventAdminFilter.dateFilter', 'eventAdminFilter.newEvents', 'eventAdminFilter.confirmedEvents'], () => {
      let now = new Date();
        $scope.start24 = Date.parse(now) - (24 * 60 * 60 * 1000);
        $scope.start1 = Date.parse(now) - (60 * 60 * 1000);

      if ($scope.eventAdminQuery) {
        if ($scope.eventAdminFilter.newEvents) {
          if ($scope.eventAdminFilter.dateFilter == 'All') {
            delete $scope.eventAdminQuery.createDate;
          } else if ($scope.eventAdminFilter.dateFilter == '24') {
            $scope.eventAdminQuery.createDate = $scope.start24;
          } else if ($scope.eventAdminFilter.dateFilter == '1') {
            $scope.eventAdminQuery.createDate = $scope.start1;
          }
        } else {
          delete $scope.eventAdminQuery.createDate;
        }

        if ($scope.eventAdminFilter.confirmedEvents) {
          if ($scope.eventAdminFilter.dateFilter == 'All') {
            delete $scope.eventAdminQuery.confirmedDate;
            $scope.eventAdminQuery.status = 'confirmed';
          } else if ($scope.eventAdminFilter.dateFilter == '24') {
            $scope.eventAdminQuery.confirmedDate = $scope.start24;
            $scope.eventAdminQuery.status = 'confirmed';
          } else if ($scope.eventAdminFilter.dateFilter == '1') {
            $scope.eventAdminQuery.confirmedDate = $scope.start1;
            $scope.eventAdminQuery.status = 'confirmed';
          }
        } else {
          delete $scope.eventAdminQuery.confirmedDate;
          delete $scope.eventAdminQuery.status;
        }
        root.eventsPipe();
      }
    });

    var sync = $interval(root.eventsPipe, (1000 * 60));

    $scope.$on('eventUpdated', () => {
      root.eventsPipe();
    });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('event');
      socket.unsyncUpdates('offer');
      $interval.cancel(sync);
    });
  }

  delete(event) {
    let url = '/api/events/' + event._id;
    _.each(this.$scope.adminEvents, (item, i) => {
      if (item._id == event._id) {
        this.$scope.adminEvents[i].drafted = true;
      }
    });
    this.$http.delete(url, event)
      .then(response => {
        this.eventsPipe();
      })
    .catch(err => {
        this.errors.other = err.message;
    })
  }

  cancel(id) {
    if (this.user.role = 'user') {
      _.each(this.$scope.adminEvents, (item, i) => {
        if (item._id == id) {
          this.$scope.adminEvents[i].drafted = true;
          this.$scope.adminEvents[i].status = 'cancelled';
        }
      });
      this.$http.post('/api/events/' + id + '/cancel', {status: 'cancelled'}).then(response => {
        this.eventsPipe();
        this.socket.syncUpdates('offer', this.$scope.offers);
      });
    }
  }

  decline(id) {        //as caterer
    if (this.user.role = 'caterer') {
      this.$http.post('/api/events/' + id + '/decline', {rejectedBy: this.user._id}).then(response => {
        _.each(this.$scope.adminEvents, (item, i) => {
          if (item._id == id) {
            this.$scope.adminEvents[i].drafted = true;
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
    _.each(this.$scope.adminEvents, (event, i) => {
      if (_.indexOf(event.rejectedBy, this.user._id) >= 0 || event.status == "cancelled") {
        this.$scope.adminEvents[i].drafted = true;
      }

      this.$http.post('/api/offers', {eventId: event._id, catererId: this.user._id}).then(response => {
        let offerUrl = (response.data.length ? '/offers/' + response.data[0]._id : '/offers/new'),
            status = (response.data.length ? response.data[0].status : null),
            offersNumber = response.data.length;
        this.$scope.adminEvents[i].offerUrl = offerUrl;
        this.$scope.adminEvents[i].offerStatus = status;
        this.$scope.adminEvents[i].offersNumber = offersNumber;
        this.socket.syncUpdates('offer', this.$scope.adminEvents);
      });
    });
  }

  prepareUserEvents() {
    _.each(this.$scope.adminEvents, (event, i) => {
      if (event.status == "cancelled") {
        this.$scope.adminEvents[i].drafted = true;
      }
      this.$http.post('/api/offers', {eventId: event._id}).then(response => {
        let offersNumber = response.data.length,
          offersInfo = '';
        _.each(response.data, (offer, j) => {
          let status = offer.status;
          this.$http.get('/api/users/' + offer.catererId).then(res => {
            offersInfo += '<div>' + res.data.name + ' <span class="label label-info">' + status + '</span></div><hr class="popover-divider" />';
            this.$scope.adminEvents[i].offersInfo = this.$sce.trustAsHtml(offersInfo);
          });
        });
        this.$scope.adminEvents[i].offersNumber = offersNumber;
        this.socket.syncUpdates('offer', this.$scope.adminEvents);
      });
    });
  }

  getEventsList() {
    if (this.user.role == 'user') {
      this.$http.post('/api/events', {userId: this.user._id}).then(response => {
        this.$scope.adminEvents = response.data;
        this.prepareUserEvents();
        this.socket.syncUpdates('event', this.$scope.adminEvents);
      });
    } else if (this.user.role == 'caterer') {
      this.$http.post('/api/events', {showToCaterers: true, sentTo: this.user._id}).then(response => {
        this.$scope.adminEvents = response.data;
        this.prepareCatererEvents();
        this.socket.syncUpdates('event', this.$scope.adminEvents);
      });
    }
  }

  showInvoice($event, event) {
    this.$scope.isInvoiceMode = true;
    this.$scope.eventForInvoice = angular.copy(event);
    this.$scope.eventForInvoice.offer = this.$scope.eventForInvoice.offers.filter((offer) => {
      console.log('eventForInvoice', this.$scope.eventForInvoice);
      return offer.paymentStatus === 'paid' || offer.status === 'completed';
    })[0];
    $event.stopPropagation();
  }

  setActiveEvent(event) {
    this.$scope.isInvoiceMode = false;
    this.$scope.eventForInvoice = null;
    this.$scope.eventActive = event._id;
    this.$rootScope.eventActive = event._id;
    this.$cookies.put('eventActive', event._id);
    this.$rootScope.$broadcast('eventActive', event._id);
    if (this.user.role === 'admin') {
      _.each(this.$scope.adminEvents, (item, i) => {
        this.$scope.adminEvents[i].active = false;
        if (item._id ==  event._id) {
          this.$scope.adminEvents[i].active = true;
        }
      });
    }
  }

}

angular.module('cateringApp')
  .controller('EventsAdminController', EventsAdminController);

