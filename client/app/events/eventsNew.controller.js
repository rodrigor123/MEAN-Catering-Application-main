'use strict';

class EventsNewController {
  constructor($http, $scope,  socket, Auth, $state, EventsService, FoodTypesService, IncludedInPriceService, ServiceTypesService, PaymentService, StripeCheckout) {
    let root = this;
    this.errors = {};
    this.submitted = false;
    this.saved = false;
    this.sent = false;
    let _this = this;

    this.Auth = Auth;
    this.$state = $state;
    this.$scope = $scope;
    this.$http = $http;
    this.socket = socket;
    this.payments = PaymentService;
    this.stripeCheckout = StripeCheckout;

    this.isLoggedIn = Auth.isLoggedIn;
    this.isAdmin = Auth.isAdmin;
    this.isManager = Auth.isManager;
    this.isCaterer = Auth.isCaterer;
    this.isUser = Auth.isUser;
    this.getCurrentUser = Auth.getCurrentUser;
    this.user = this.getCurrentUser();

    this.ftService = FoodTypesService;
    this.incService = IncludedInPriceService;
    this.sService = ServiceTypesService;
    this.addressValidationError = "Please enter a valid address";

    this.$scope.fm = {};
    this.$scope.fm.date = this.$scope.date = new Date();
    this.$scope.fm.time = this.$scope.time = new Date();
    this.$scope.fm.people = 1;
    this.$scope.fm.vegetarianMeals = 0;
    this.$scope.fm.pricePerPerson = 0.5;
    this.$scope.fm.selectedCaterers = [];
    this.$scope.selectionOccured = true;
    this.$scope.fm.subTotal = this.$scope.fm.pricePerPerson * this.$scope.fm.people;
    this.$scope.fm.toggleSymbol = true;
    this.$scope.fm.tipType = '%';
    this.$scope.fm.totalEvent = '';

    this.$scope.fm.foodTypes = [];
    this.$scope.foodTypes = [];
    this.$scope.fm.serviceTypes = [];
    this.$scope.serviceTypes = [];
    this.$scope.caterers = [];
    this.$scope.card = {};

    this.$scope.filter = {
      allFt: true,
      allSt: false,
      selectAll: false
    }

    this.getCaterers().then((caterers) => {
      this.$scope.caterers = caterers;
    })
    .then(() => {
      return this.ftService.getFoodTypes();
    })
    .then((ftdata)=> {
      this.$scope.foodTypes = ftdata;
    })
    .then(() => {
      return this.sService.getServiceTypes();
    })
    .then((stdata)=> {
      this.$scope.serviceTypes = stdata;
    })
    .then(() => {
      this.toggleAllFT();
    });

    $scope.dateOptions = {
      formatYear: 'yy',
      minDate: new Date(),
      startingDay: 1
    };

    $scope.popup1 = {
      opened: false
    };


    // Update Vegetarian Meals, Standard Meals.
    $scope.$watch('fm.people', updateValue3);
    $scope.$watch('fm.vegetarianMeals', updateValue3);

    function updateValue3() {
      $scope.fm.totalMeals = +$scope.fm.people - +$scope.fm.vegetarianMeals;
    }

    // Watch & Update SubTotal
    $scope.$watch('fm.people', updateSubTotal);
    $scope.$watch('fm.pricePerPerson', updateSubTotal);

    function updateSubTotal() {
      $scope.fm.subTotal = $scope.fm.pricePerPerson * $scope.fm.people;
    }

    // Update Symbol
    $scope.$watch('fm.toggleSymbol', updateSymbol);

    function updateSymbol() {
      if($scope.fm.toggleSymbol)
        $scope.fm.tipType = '%';
      else
        $scope.fm.tipType = '$';
    }

    // Update Total Amount.
    $scope.$watch('fm.people', updateTotalEvent);
    $scope.$watch('fm.pricePerPerson', updateTotalEvent);
    $scope.$watch('fm.tip', updateTotalEvent);
    $scope.$watch('fm.toggleSymbol', updateTotalEvent);

    function updateTotalEvent() {
      if($scope.fm.tip) {
        if($scope.fm.tipType == '%'){
          $scope.fm.totalEvent = $scope.fm.subTotal + $scope.fm.tip/100 * $scope.fm.subTotal;
        }else if($scope.fm.tipType == '$'){
          $scope.fm.totalEvent = $scope.fm.subTotal + $scope.fm.tip;
        }
      }else {
        $scope.fm.totalEvent = $scope.fm.subTotal;
      }
    }

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };

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

  }

  toggleAllFT() {
    if (this.$scope.filter.allFt) {
      this.$scope.fm.foodTypes = _.map(this.$scope.foodTypes, (ft) => {
        return ft._id;
      });
    } else {
      this.$scope.fm.foodTypes = [];
    }
    this.toggleCat();
  }

  toggleAllST() {
    if (this.$scope.filter.allSt) {
      this.$scope.fm.serviceTypes = _.map(this.$scope.serviceTypes, (st) => {
        return st._id;
      });
    } else {
      this.$scope.fm.serviceTypes = [];
    }
    this.toggleCat();
  }

  checkFT(id, caterer) {
    if (_.indexOf(caterer.foodTypes, id) > -1) {
      return true;
    } else {
      return false;
    }
  }

  checkST(id, caterer) {
    if (_.indexOf(caterer.serviceTypes, id) > -1) {
      return true;
    } else {
      return false;
    }
  }

  toggleCatOnclick(t) {
    if (t == 'ft') {
      this.$scope.filter.allFt = false;
    } else if (t == 'st') {
      this.$scope.filter.allSt = false;
    }

    this.toggleCat();

  }

  toggleCat() {
    let selectedFT = this.$scope.fm.foodTypes,
      selectedST = this.$scope.fm.serviceTypes;

    _.each(this.$scope.caterers, (item, i) => {
      let intersectFT = _.intersection(item.foodTypes, selectedFT),
        intersectST = _.intersection(item.serviceTypes, selectedST);
        
      if (!selectedFT.length && !selectedST.length) {
        this.$scope.caterers[i].showByCat = true;
      } else if (selectedFT.length && !selectedST.length) {
        this.$scope.caterers[i].showByCat = !!(intersectFT.length);
      } else if (!selectedFT.length && selectedST.length) {
        this.$scope.caterers[i].showByCat = !!(intersectST.length);
      } else if (selectedFT.length && selectedST.length) {
        this.$scope.caterers[i].showByCat = !!(intersectFT.length && intersectST.length);
      }

      if (_.indexOf(this.$scope.fm.selectedCaterers, item._id) < 0) {
        this.$scope.caterers[i].showByEdit = false;
      } else {
        this.$scope.caterers[i].showByEdit = true;
      }

    });
  }

  watchForEdit(id) {
    this.$scope.selectionOccured = true;
    if (_.indexOf(this.$scope.fm.selectedCaterers, id) < 0) {
      this.addToSelected(id);
      _.each(this.$scope.caterers, (item, i) => {
        if (item._id === id) {
        this.$scope.caterers[i].showByEdit = true;
      }
    });
  } else {
    this.removeFromSelected(id);
    _.each(this.$scope.caterers, (item, i) => {
      if (item._id === id) {
        this.$scope.caterers[i].showByEdit = false;
      }
    });
  }
  }

  removeFromSelected(id) {
    _.pull(this.$scope.fm.selectedCaterers, id);
  }

  addToSelected(id) {
    this.$scope.fm.selectedCaterers.push(id);
  }

  toggleAll() {

    _.each(this.$scope.caterers, (item, i) => {
      if (this.$scope.filter.selectAll) {
        this.addToSelected(item._id);
        this.$scope.caterers[i].showByEdit = true;
      }
      if (!this.$scope.filter.selectAll) {
        this.removeFromSelected(item._id);
        this.$scope.caterers[i].showByEdit = false;
      }
    });

  }

  getCaterers() {
    return this.$http.get('/api/users/caterers').then(response => {
      return response.data;
    });
  }

  sendRequest(form) {
    let eventModel = this.$scope.fm,
      url = (this.saved ? '/api/events/' + this.$scope.fm._id : '/api/events/new');

    eventModel.showToCaterers = true;
    eventModel.sentTo = eventModel.selectedCaterers;
    eventModel.status = 'sent';
    eventModel.userId = this.user._id;
    eventModel.createDate = new Date();

    if (this.$scope.fm.status == 'sent') eventModel.isUpdated = true;
console.log(eventModel);    
    if (eventModel && form.$valid && !this.addressValidationError) {
      this.$http.post(url, eventModel)
        .then(response => {
          this.sent = true;
          this.$state.go('events', { time: 'active' });
        })
        .catch(err => {
          this.errors.other = err.message;
        });
    }

  }  

  cancel() {
    this.$state.go('events', { time: 'active' });
  }

  saveDraft(form) {
    let eventModel = this.$scope.fm;

    eventModel.userId = this.user._id;
    eventModel.status = 'draft';

    //if (eventModel && form.$valid) {
    if (eventModel && form.$valid && !this.addressValidationError) {
      //return this.payments.verifyAddress(eventModel.address).then(address => {
        //eventModel.address = address;

        return this.$http.post('/api/events/new', eventModel)
          .then(response => {
            this.saved = true;

            this.$scope.fm._id = response.data._id;
          })
          .catch(err => {
            this.errors.other = err.message;
          })
      //}).catch(result => {
      //  this.addressValidationError = result.ErrDescription;
      //});

    }
  }
}

angular.module('cateringApp')
  .controller('EventsNewController', EventsNewController);