'use strict';

/* Controllers */

var workroomControllers = angular.module('workplaceControllers', []);

workroomControllers.controller('WorkroomCtrl', ['$scope', 'Workroom', function ($scope, Workroom) {
  $scope.workrooms = Workroom.query();
  //$http.get('workrooms/workrooms.json').success(function(data) {
  //  $scope.workrooms = data;
  //});
}]);

workroomControllers.controller('WorkroomDetailCtrl', ['$scope', '$routeParams', 'Workroom',
  function($scope, $routeParams, Workroom) {
    //$http.get('workrooms/' + $routeParams.workroomId + '.json').success(function(data) {
    //  $scope.messages = data;
    //});
    $scope.messages = Workroom.get({workroomId: $routeParams.workroomId}); //, function(workroom) {
    //  alert('test'+workroomId);
    //});
    $scope.workroomId = $routeParams.workroomId;
    alert('messages: '+$scope.messages);
  }]);
