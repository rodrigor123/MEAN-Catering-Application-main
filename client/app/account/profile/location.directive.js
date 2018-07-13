'use strict';

angular.module('cateringApp')
  .directive('location', ($rootScope) => ({
    restrict: 'A',
    link: (scope, element, attrs, $rootScope) => {
      let locationOptions = {
            //types: ['geocode'],
            types: ['address'],
            //types: ['(regions)'],
            componentRestrictions: {country: "US"}
      };

      let el = element.get(0),
          defaultBounds = new google.maps.LatLngBounds(new google.maps.LatLng(-33.8902, 151.1759), new google.maps.LatLng(-33.8474, 151.2631)),
          placeSearch, geolocation, circle,
          autocomplete = new google.maps.places.Autocomplete(el, locationOptions);

      /*if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          geolocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          circle = new google.maps.Circle({
            center: geolocation,
            radius: position.coords.accuracy
          });
          defaultBounds = circle.getBounds();
        });
      }*/

/*      autocomplete.addListener('place_changed', () => {
        console.log("place changed");
        let place = autocomplete.getPlace(),
            address = '';

        if (place.formatted_address) {
          address = place.formatted_address;
        }

        console.log("autocomplete place:", place);

        if (scope.vm.user && scope.vm.user.location) {
          scope.vm.user.location = address;
          scope.vm.user.address = getAddress(place);
          console.log('we here in user', scope.vm.user);
        }
        if (scope.fm && scope.fm.location) {
          scope.fm.location = address;
          scope.fm.address = getAddress(place);
        }
      });*/

      autocomplete.addListener('place_changed', () => {
        let place = autocomplete.getPlace(),
            address = '';

        let checkResult = checkAddress(place);

        if(!checkResult){
          scope.vm.addressValidationError = "Please enter a valid address";
        } else {
          scope.vm.addressValidationError = false;

          if (place.formatted_address) {
            address = place.formatted_address;
          }

          if (scope.vm.user && scope.vm.user.location) {
            scope.vm.user.location = address;
            scope.vm.user.address = getAddress(place);
            console.log('we here in user', scope.vm.user);
          }

          if (scope.fm && scope.fm.location) {
            scope.fm.location = address;
            scope.fm.address = getAddress(place);
          }
        }
      });

      autocomplete.setBounds(defaultBounds);
    }
}));

function getAddress(place) {
  /*let formatedComponents = place.formatted_address.split(',').map(item => item.trim());
  let region = getByIndex(formatedComponents, -2).split(' ').map(item => item.trim());
    return {
    Address1: formatedComponents[0],
    Address2: '',
    City: getByIndex(formatedComponents, -3),
    State: getByIndex(region, -2),
    Zip5: getByIndex(region, -1),
    Zip4: '0000'
  }
  */
  let address = place.address_components;
  let route = "";
  let city = "";
  let state = "";
  let zipCode = "";

  _.each(address, (item, i) => {
    if (item.types[0] === 'route') {
      route = item.long_name;
    }

    if (item.types[0] === 'locality') {
      city = item.long_name;
    }

    if (item.types[0] === 'administrative_area_level_1') {
      state = item.short_name;
    }

    if (item.types[0] === 'postal_code') {
      zipCode = item.long_name;
    }
  });

  return {
    Address1: route,
    Address2: '',
    City: city,
    State: state,
    Zip5: zipCode,
    Zip4: '0000'
  }
}

function getByIndex(arr, index) {
  if (index < 0) {
    index = arr.length + index;
  }
  return arr[index];
}

function checkAddress(place){
  let address = place.address_components;
  let route = false;
  let zipCode = false;

  _.each(address, (item, i) => {
    if (item.types[0] === 'route') {
      route = true;
    }

    if (item.types[0] === 'postal_code') {
      zipCode = true;
    }
  });

  return route && zipCode;
}
