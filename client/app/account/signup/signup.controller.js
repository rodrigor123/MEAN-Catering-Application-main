'use strict';

class SignupController {
  //end-non-standard

  constructor(Auth, $state, $scope, FoodTypesService, ServiceTypesService, PaymentService, $window) {
    this.Auth = Auth;
    this.payments = PaymentService;
    this.$state = $state;
    this.$scope = $scope;
    this.user = {};
    this.addressValidationError = null;

    this.$scope.signupProcess = true;
    this.$scope.signupSuccess = false;

    this.ftService = FoodTypesService;
    this.stService = ServiceTypesService;
    this.user = {};
    this.user.radius = 20;
    this.addressValidationError = null;
    this.$scope.foodTypes = [];
    this.$scope.serviceTypes = [];

    this.ftService.getFoodTypes().then((data)=> {
      this.$scope.foodTypes = data;
    });
    this.stService.getServiceTypes().then((data)=> {
      this.$scope.serviceTypes = data;
    });
  }
    //start-non-standard

  register(form) {

    let role = 'user',
      request = {
        firstname: this.user.firstname,
        lastname: this.user.lastname,
        email: this.user.email,
        password: this.user.password,
        userphone: this.user.userphone,
        role: role
      };
    this.submitted = true;

    if (this.user.role) {
      request.role = 'caterer';
      request.contactInfo = this.user.contactInfo;
      request.companyName = this.user.companyName;
      request.location = this.user.location;
      request.address = this.user.address;
      request.contact_email = this.user.contact_email;
      request.contact_phone = this.user.contact_phone;
      request.ninja_firstname = this.user.ninja_firstname;
      request.ninja_lastname = this.user.ninja_lastname;
      request.ninja_email = this.user.ninja_email;
      request.ninja_phone = this.user.ninja_phone;
      request.serviceTypes = this.user.serviceTypes;
      request.foodTypes = this.user.foodTypes;
      request.minprice = this.user.minprice;
      request.description = this.user.description;
      request.veganOffers = this.user.veganOffers;
      request.website = this.user.website;
      request.phone = this.user.phone;
      request.sendSummary = true;
      request.sendNotification = true;
      request.radius = this.user.radius;
    }

    if (/*this.user.role && */ form.$valid) {
    //  /his.payments.verifyAddress(request.address).then(address => {
    //    request.address = address;
    //    _register.call(this, request, form);
    //  }).catch(result => {
    //    this.addressValidationError = result.ErrDescription;
    //  });
    //} else if (!this.user.role && form.$valid) {

      _register.call(this, request, form);
    }

  }
}


function _register(request, form) {
  return this.Auth.createTempUser(request)
    .then(() => {
      let root = this;
      this.$scope.signupProcess = false;
      this.$scope.signupSuccess = true;
      //$window.location.href = 'cateringninja.com';
      window.location.href = "http://www.cateringninja.com/thank-you";
    })
    .catch(err => {
      err = err.data;
      this.errors = {};

      // Update validity of form fields that match the mongoose errors
      angular.forEach(err.errors, (error, field) => {
        form[field].$setValidity('mongoose', false);
        this.errors[field] = error.message;
      });

    });

}


angular.module('cateringApp')
  .controller('SignupController', SignupController);
