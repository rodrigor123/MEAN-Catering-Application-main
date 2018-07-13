'use strict';

angular.module('cateringApp')
  .directive('taxCloudInfoForm', function() {
    return {
      templateUrl: 'components/tax-cloud-info-form/tax-cloud-info-form.html',
      restrict: 'E',
      require: '^form',
      scope: {
        form: '=',
        model: '='
      },
      bindToController: true,
      controller: 'TaxCloudInfoFormController as vm'
    };
  });
