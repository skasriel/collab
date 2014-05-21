'use strict';

angular.module('mpk.filters', []).filter('cardDetails', function () {
	return function (input) {
		if (input == undefined || input === '') return input;
		return input.replace(/&#10;/g, "<br />");
	};
});
