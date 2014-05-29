'use strict';

// Create a new card
var NewKanbanCardController = function ($scope, $http, $rootScope, $routeParams, $modalInstance, kanbanManipulator, colorOptions, column) {
	function initScope(scope, colorOptions) {
		scope.kanbanColumnName = column.name;
		scope.column = column;
		scope.title = '';
		scope.details = '';
		scope.cardColor = colorOptions[0];
		scope.colorOptions = colorOptions;
		$http.get('/api/users/').success(function(data) {
			scope.allUsers = data;
			console.log("Getting user list for new kanban card modal: # of users: "+data.length+" $scope="+$scope);
		});
	}


	$scope.addKanbanCard = function() {
		if (!this.newCardForm.$valid){
			return false;
		}
		console.log("invited = "+this.assignee); //JSON.stringify(this.inviteUsers)+" "+this.InviteUserController);
		$modalInstance.close({ // calls the then() of KanbanController
			title: this.title,
			column: column,
			details: this.details,
			color: this.cardColor,
			assignee: this.assignee
		});

		/*var url = '/api/workrooms/'+$routeParams.workroomId+'/kanban/card';
		console.log("post to: "+url);
		$http.post(url,
			{
				'columnName'  : $scope.column.name,
				'title'       : $scope.title,
				'details'     : $scope.details,
				'cardColor'   : $scope.cardColor
			})
		.success(function(data, status, headers, config) {
			console.log("Post message result: "+status+" - "+data.msg);
		}).error(function(data, status) {
			console.log("Post message error: "+status+" "+data.error);
		});*/

	};

	$scope.close = function(){
		$modalInstance.close();
	};

	initScope($scope, colorOptions);
};
