(function(angular, undefined) {
  angular.module("cateringApp.constants", [])

.constant("appConfig", {
	"userRoles": [
		"guest",
		"user",
		"admin",
		"caterer"
	]
})

;
})(angular);