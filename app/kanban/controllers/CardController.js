'use strict';

// View / Update a card
var CardController = function ($scope, $http, $modalInstance, colorOptions, card) {
	function initScope(scope, card, colorOptions){
		scope.name = card.name;
		scope.details = card.details;
		scope.card = card;
		scope.cardColor = card.color;
		scope.colorOptions = colorOptions;
    scope.assignee = card.assignee;
    $http.get('/api/users/').success(function(data) {
      scope.allUsers = data;
      scope.assignee = card.assignee;
      console.log("Getting user list for edit kanban card modal: # of users: "+data.length+" assignee="+scope.assignee);
    });
	}

	$scope.close = function(){
		$modalInstance.close();
	};

	$scope.updateKanbanCard = function(){
		if (!this.cardDetails.$valid){
			return false;
		}
		this.card.name = this.name;
		this.card.details = this.details;
		this.card.color = this.cardColor;
    this.card.assignee = this.assignee;

		$modalInstance.close(this.card);
	};

	initScope($scope, card, colorOptions);
};
