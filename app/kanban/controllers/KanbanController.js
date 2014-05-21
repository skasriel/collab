//'use strict';

var KanbanController = function ($scope, $rootScope, $http, $modal, $routeParams, kanbanManipulator) {
    $scope.addNewCard = function(column) {
		var modalInstance = $modal.open({
			templateUrl: 'NewKanbanCard.html',
			controller: 'NewKanbanCardController',
			resolve: {
				colorOptions: function(){ return $scope.colorOptions; },
				column: function(){ return column; }
			}
		});

    modalInstance.result.then(function(cardDetails) {
      if (!cardDetails) return;
      kanbanManipulator.addCardToColumn($scope.kanban, cardDetails.column, cardDetails.title, cardDetails.details, cardDetails.color);
      // post a message to server about this (the actual saving of the board happens through the watcher, saving the entire board every time)

      var url = '/api/workrooms/'+$routeParams.workroomId+'/messages';
      alert("root2 = "+$rootScope);

      var message = '@'+$rootScope.active_user.username+" created new task "+cardDetails.title;
      alert("post "+message);
      $http.post(url,
        {
          '_type': 'KanbanMessage',
          'actor': $rootScope.active_user.username,
          'action': 'new_card',

          'html': message
        }
      )
      .success(function(data, status, headers, config) {
        console.log("Post message result: "+status+" - "+data.msg);
      }).error(function(data, status) {
        console.log("Post message error: "+status+" "+data.error);
      });

    });
	};

	$scope.delete = function(card, column){
		if (confirm('Are you sure?')){
			kanbanManipulator.removeCardFromColumn($scope.kanban, column, card);
		}
	};

	$scope.openCardDetails = function(card){
		$modal.open({
			templateUrl: 'OpenCard.html',
			controller: 'CardController',
			resolve: {
				colorOptions: function(){ return $scope.colorOptions; },
				card: function(){ return card; }
			}
		});
	};

	$scope.details = function(card){
		if (card.details !== undefined && card.details !== '') {
			return card.details;
		}
		return card.name;
	};

	$scope.colorFor = function(card) {
		return (card.color !== undefined && card.color !== '') ? card.color : $scope.colorOptions[0];
	};
};
