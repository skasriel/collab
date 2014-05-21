'use strict';

var NewKanbanCardController = function ($scope, $routeParams, $modalInstance, kanbanManipulator, colorOptions, column) {
	function initScope(scope, colorOptions) {
		scope.kanbanColumnName = column.name;
		scope.column = column;
		scope.title = '';
		scope.details = '';
		scope.cardColor = colorOptions[0];
		scope.colorOptions = colorOptions;
	}

	$scope.addNewCard = function(){
		if (!this.newCardForm.$valid){
			return false;
		}
		$modalInstance.close({title: this.title, column: column, details: this.details, color: this.cardColor});

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
