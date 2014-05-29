'use strict';

var postMessage = function(http, message, routeParams) {
  var url = '/api/workrooms/'+routeParams.workroomId+'/messages';
  http.post(url, message)
  .success(function(data, status, headers, config) {
    console.log("Post message result: "+status+" - "+data.msg);
  }).error(function(data, status) {
    console.log("Post message error: "+status+" "+data.error);
  });
};

var KanbanController = function ($scope, $rootScope, $http, $modal, $routeParams, kanbanManipulator) {
    $scope.addKanbanCard = function(column) {
  		var modalInstance = $modal.open({
  			templateUrl: 'NewKanbanCard.html',
  			controller: 'NewKanbanCardController',
  			resolve: {
  				colorOptions: function(){ return $scope.colorOptions; },
  				column: function(){ return column; }
  			}
		});

    modalInstance.result.then(function(cardDetails) { // gets called from NewKanbanController when modal gets closed
      if (!cardDetails) return;
      kanbanManipulator.addCardToColumn($scope.kanban, cardDetails.column, cardDetails.title, cardDetails.details, cardDetails.color, cardDetails.assignee);
      // post a message to server about this (the actual saving of the board happens through the watcher, saving the entire board every time)


      // Post a message to the message list. Unclear whether this should be done on the client side or server side...
      var messageHTML = '@'+$rootScope.active_user.username+" created new task '"+cardDetails.title+"'";
      if (cardDetails.assignee && cardDetails.assignee!=$rootScope.active_user.username)
        messageHTML += ", assigned to @"+cardDetails.assignee;
      var message = {
        '_type': 'KanbanMessage',
        'actor': $rootScope.active_user.username,
        'action': 'new_card',
        'html': messageHTML
      };
      postMessage($http, message, $routeParams);
    });
	};

	$scope.delete = function(card, column) {
		if (!confirm('Are you sure?'))
      return;
    alert(JSON.stringify(card));
    var messageHTML = '@'+$rootScope.active_user.username+" deleted task '"+card.name+"'";
    var message = {
      '_type': 'KanbanMessage',
      'actor': $rootScope.active_user.username,
      'action': 'delete_card',
      'html': messageHTML
    };
    postMessage($http, message, $routeParams);
    kanbanManipulator.removeCardFromColumn($scope.kanban, column, card);
	};

	$scope.openCardDetails = function(card) {
		$modal.open({
			templateUrl: 'OpenCard.html',
			controller: 'CardController',
			resolve: {
				colorOptions: function(){ return $scope.colorOptions; },
				card: function(){ return card; }
			}
		});
	};

	$scope.details = function(card) {
		if (card.details !== undefined && card.details !== '') {
			return card.details;
		}
		return card.name;
	};

	$scope.colorFor = function(card) {
		return (card.color !== undefined && card.color !== '') ? card.color : $scope.colorOptions[0];
	};
};
