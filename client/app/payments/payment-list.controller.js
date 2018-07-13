'use strict';

class PaymentListController {
  constructor($http, $scope, $rootScope, socket, Auth, $state, IncludedInPriceService, $interval, $filter, $uibModal, $log, $timeout) {

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
    this.socket = socket;
    this.incService = IncludedInPriceService;
    this.getCurrentUser = Auth.getCurrentUser;
    this.isLoggedIn = Auth.isLoggedIn;
    this.user = this.$scope.user = this.getCurrentUser();
    this.$scope.eventActive = null;
    this.$scope.events = [];
    this.$scope.displayed = [];
    this.$scope.eventsSummary = null;

    this.$scope.selectedEvents = {};
    this.$scope.disabledEvents = {};

    this.$scope.states = {
      allEventsAreSelected: false
    };

    $scope.selectAll = (value) => {
      $scope.states.allEventsAreSelected = value;
      $scope.events.forEach(event => $scope.selectedEvents[event._id] = value);
      if ($scope.calculateSummary instanceof Function) {
        $scope.calculateSummary();
      }
    };
    $scope.isSelected = event => !!$scope.selectedEvents[event._id];
    $scope.isDisabled = event => !!$scope.disabledEvents[event._id];

    let summaryQuery = {};
    if (this.user.role === 'caterer') {
      summaryQuery.catererId = root.user._id;
    }

    $http.post('/api/payments/summary', summaryQuery).then(response => {
      $scope.payments = response.data;
    });

    $scope.select = () => {
      let allIsSelected = true;
      for (let k in $scope.selectedEvents) {
        if(!$scope.selectedEvents[k]) {
          allIsSelected = false;
          break;
        }
      }
      $scope.states.allEventsAreSelected = allIsSelected;
      $scope.calculateSummary();
    };
    $scope.selectAll(false);

    $scope.paySelected = () => {
      let selectedEventIds = [];
      for (let k in $scope.selectedEvents) {
        if($scope.selectedEvents[k]) {
          selectedEventIds.push(k);
        }
      }
      let selectedEvents = $scope.events.filter(event => selectedEventIds.includes(event._id));

      if (selectedEvents.length) {
        selectedEvents.forEach(event => $scope.disabledEvents[event._id] = true);
        this.$http.post('/api/payments/pay', {
          items: selectedEvents.map(event => event.offers[0]._id)
        }).then(response => {
          $scope.$emit('eventUpdated');
        }).catch(response => $state.go('dwolla'));
      }
    };

    $scope.pay = (offer) => {
      $scope.disabledEvents[offer.eventId] = true;
      this.$http.post('/api/payments/pay', {
        items: [offer._id]
      }).then(response => {
        $scope.$emit('eventUpdated');
      }).catch(response => $state.go('dwolla'));
    };

    $scope.isPiping = false;

    $scope.selectedDate = null;

    $scope.setDate = ($event, date) => {
      if ($scope.filter.paid === 'allPaid') {
        $event.stopPropagation();
        $scope.selectedDate = date;
        $scope.filter.datePaid = date;
        console.log('select');
      }
    };

    $scope.deselectDate = () => {
      if ($scope.filter.paid === 'allPaid' && $scope.selectedDate) {
        $scope.filter.datePaid = null;
        $scope.selectedDate = null;
        console.log('deselect selected date');
      }
    };

    $scope.open = (offer) => {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'adjustPayment.html',
        controller: ($scope, $uibModalInstance, $http, $rootScope) => {
          $scope.confirm = false;

          $scope.totalRefund = angular.copy(offer.invoice);
          $scope.totalRefund.refund = $scope.totalRefund.total;
          $scope.totalRefund.adjustment.client = 0;
          $scope.totalRefund.adjustment.caterer = 0;
          $scope.totalRefund.adjustment.chargeOff = 0;
          $scope.partialRefund = angular.copy(offer.invoice);
          $scope.partialRefund.refund = 0;
          $scope.updatedInvoice = $scope.totalRefund;
          $scope.subTotal = $scope.totalRefund.service;
          $scope.tip = $scope.totalRefund.tip;
          $scope.partialRefund.tip = $scope.tip;

          $scope.$watch('partialRefund.tip', function(newVal, oldVal) {
            $scope.partialRefund.total = $scope.subTotal + $scope.partialRefund.tax + newVal;
          })

          $scope.setAdjustment = (updatedInvoice) => {
            $scope.updatedInvoice = updatedInvoice;
          };

          $scope.ok = () => {
            $scope.confirm = true;
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };

          $scope.confirmAdjustment = function() {
            $scope.updatedInvoice.service = $scope.updatedInvoice.pricePerPerson * $scope.updatedInvoice.people + $scope.tip;
            angular.merge(root.$scope.eventActive.offers[0].invoice, $scope.updatedInvoice);

            $http.post('/api/offers/' + root.$scope.eventActive.offers[0]._id, root.$scope.eventActive.offers[0]).then(response => {
              $http.post('/api/events/' + root.$scope.eventActive._id, root.$scope.eventActive).then(response => {
                $uibModalInstance.close();
              })
            });

            pay(root.$scope.eventActive.offers[0]);
          }

          $scope.cancelConfirm = function() {
            $scope.confirm = false;
          }

          function pay(offer){
            // $scope.disabledEvents[offer.eventId] = true;
            $http.post('/api/payments/pay', {
              items: [offer._id]
            }).then(response => {
              $rootScope.$emit('eventUpdated');
            }).catch(response => $state.go('dwolla'));
          };
        },
        size: 'lg'
      });

      modalInstance.result.then(function () {
        //$scope.selected = selectedItem;
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
    };

    $scope.includedInPrice = this.incService.getIncludedInPrice().then((data)=> {
      $scope.includedInPrice = data;
    });

    $scope.hasSelectedEvents = () => {
      if (Object.keys($scope.selectedEvents).length === 0) {
        return false;
      }
      let selectedEvents = [];
      for (let k in $scope.selectedEvents) {
        selectedEvents.push($scope.selectedEvents[k]);
      }
      return selectedEvents.some(item => item === true);
    };

    $scope.query = { status: 'confirmed', paymentList: true };

    function convertIncludedInPrice(array) {
      let cnt = [];
      _.each($scope.includedInPrice, (item, j) => {
        if (_.indexOf(array, item._id) > -1) {
          cnt.push(item);
        }
      });
      return cnt;
    }

    $scope.filter = {
      paid: 'allPaid', //allUnpaid
      dateTo: null,
      datePaid: null
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      //minDate: new Date(),
      startingDay: 1
    };

    $scope.popup1 = {
      opened: false
    };

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };

    $scope.popup2 = {
      opened: false
    };

    $scope.open2 = function() {
      $scope.popup2.opened = true;
    };


    this.pipe = function(tableState) {
      $scope.isPiping = true;
      $scope.tableState = (angular.isObject(tableState) && tableState ? tableState : $scope.tableState);

      if (angular.isUndefined($scope.tableState)) {
        $scope.tableState = {
          search: {},
          pagination: {},
          sort: {}
        }
      }

      $http.post('/api/events/dataset', $scope.query).then(response => {
        $scope.events = response.data;

        $scope.calculateSummary();

        let filtered = $scope.tableState && $scope.tableState.search.predicateObject ? $filter('filter')($scope.events, $scope.tableState.search.predicateObject) : $scope.events,
          start = $scope.tableState.pagination.start || 0,
          number = $scope.tableState.pagination.number || $scope.events.length;

        if ($scope.tableState && $scope.tableState.sort.predicate) {
          filtered = $filter('orderBy')(filtered, $scope.tableState.sort.predicate, $scope.tableState.sort.reverse);
        }
        if (root.user.role === 'caterer') {
          filtered = $filter('filter')(filtered, {confirmedBy: root.user._id})
        }

        $scope.displayed = filtered.slice(start, start + number);
        if ($scope.tableState) {
          $scope.tableState.pagination.numberOfPages = Math.ceil(filtered.length / number);
        }
        if ($scope.eventActive) $scope.setActiveEvent($scope.eventActive);
        $scope.isPiping = false;
      });
    };

    $scope.notDefaultSummary = () => {
      if ($scope.eventsSummary instanceof Object) {
        let sum = 0;
        for(let k in $scope.eventsSummary) {
          if ($scope.eventsSummary[k] instanceof Object) {
            for(let k2 in $scope.eventsSummary[k]) {
              sum += $scope.eventsSummary[k][k2];
            }
          } else {
            sum += $scope.eventsSummary[k];
          }
        }
        return sum > 0;
      }
      return false;
    };

    $scope.calculateSummary = () => {

      $scope.eventsSummary = {
        service: 0,
        tax: 0,
        total: 0,
        commission: 0,
        refund: 0,
        adjustment: {
          client: 0,
          chargeOff: 0,
          caterer: 0
        },
        net: 0,
        stripeFee: 0,
        netHouse: 0
      };

      _.each($scope.events, (event, i) => {
        $scope.events[i].includedInPrice = convertIncludedInPrice(event.includedInPrice);
        if ($scope.events[i].offers.length) {
          $scope.events[i].offers[0].includedInPrice = convertIncludedInPrice(event.offers[0].includedInPrice);
          if (event.offers[0].invoice) {
            $scope.events[i].offers[0].priceWithCounter = event.offers[0].invoice.total;
          } else if (event.offers[0].counter) {
            $scope.events[i].offers[0].priceWithCounter = event.pricePerPerson * event.people - event.offers[0].counter;
          } else {
            $scope.events[i].offers[0].priceWithCounter = event.pricePerPerson * event.people;
          }
        }

        console.log($scope.filter.paid === 'allUnpaid' && $scope.selectedEvents && $scope.isSelected(event));

        if (event.offers[0] && ($scope.filter.paid === 'allPaid' || ($scope.filter.paid === 'allUnpaid' && $scope.selectedEvents && $scope.isSelected(event)))) {
          let commission = parseFloat(((event.offers[0].invoice.service + event.offers[0].invoice.tax) * event.offers[0].invoice.commission / 100).toFixed(2)) || 0;
          $scope.eventsSummary.service += event.offers[0].invoice.service || 0;
          $scope.eventsSummary.tax += event.offers[0].invoice.tax || 0;
          $scope.eventsSummary.total += parseFloat((event.offers[0].invoice.service + event.offers[0].invoice.tax).toFixed(2)) || 0;
          $scope.eventsSummary.commission += commission;
          $scope.eventsSummary.refund += event.offers[0].invoice.refund || 0;
          $scope.eventsSummary.adjustment.client += event.offers[0].invoice.adjustment.client || 0;
          $scope.eventsSummary.adjustment.chargeOff += event.offers[0].invoice.adjustment.chargeOff || 0;
          $scope.eventsSummary.adjustment.caterer += event.offers[0].invoice.adjustment.caterer || 0;
          $scope.eventsSummary.net += event.offers[0].invoice.refund ? 0 : ((event.offers[0].invoice.service + event.offers[0].invoice.tax) * (100 - event.offers[0].invoice.commission)/100) - event.offers[0].invoice.adjustment.caterer;
          $scope.eventsSummary.stripeFee += event.offers[0].invoice.stripeFee || 0;
          $scope.eventsSummary.netHouse += (commission - event.offers[0].invoice.adjustment.chargeOff - event.offers[0].invoice.stripeFee) || 0;
        }

      });
    };

    $scope.setActiveEvent = function(event) {
      $scope.eventActive = event;

      _.each($scope.events, (item, i) => {
        $scope.events[i].active = false;
        if (item._id == event._id) {
          $scope.events[i].active = true;
        }
      });
    };

    $scope.$watchGroup(['filter.paid', 'filter.dateTo', 'filter.datePaid'], () => {

      if (!$scope.eventActive) {
        $scope.eventActive = null;
      }

      if (!$scope.selectedDate) {
        $scope.selectedDate = null;
      }

      if (root.user.role === 'caterer') {
        $scope.query.catererId = root.user._id;
        $scope.query.showToCaterers = true;
      } else {
        delete $scope.query.catererId;
        delete $scope.query.showToCaterers;
      }

      if ($scope.filter.datePaid) {
        $scope.query.datePaid = $scope.filter.datePaid;
      }

      if ($scope.filter.paid === 'allPaid') {
        $scope.query.status = { $in: ['completed'] };
        $scope.query.paymentStatus = { $in: ['completed'] };
      } else if ($scope.filter.paid === 'allUnpaid') {
        $scope.query.status = { $in: ['confirmed'] };
        $scope.query.paymentStatus = { $in: ['paid', 'hold'] };
        $scope.filter.datePaid = null;
        $scope.selectedDate = null;
      }

      if (!$scope.filter.datePaid) {
        delete $scope.query.datePaid;
      }

      if ($scope.filter.dateTo) {
        $scope.query.date = { $lte: $scope.filter.dateTo };
      } else {
        delete $scope.query.date;
      }

      this.pipe();
    });

    var sync = $interval(root.pipe, (1000 * 60));

    $scope.$on('eventUpdated', () => {
      root.pipe();
      $http.post('/api/payments/summary', summaryQuery).then(response => {
        $scope.payments = response.data;
      });
    });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('event');
      socket.unsyncUpdates('offer');
      $interval.cancel(sync);
    });
  }
}

angular.module('cateringApp')
  .controller('PaymentListController', PaymentListController);

