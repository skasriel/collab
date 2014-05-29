'use strict';
function Kanban(name, numberOfColumns) {
	this.name = name;
	this.numberOfColumns = numberOfColumns;
	this.columns = [];
	console.log("created kanban: "+name+" "+numberOfColumns);
}

function KanbanColumn(name){
	return {
		name: name,
		cards: []
	};
}

function KanbanCard(name, details, color, assignee) {
	this.name = name;
	this.details = details;
	this.color = color;
	this.assignee = assignee;
	console.log("created card: "+name+" "+details+" "+color+" assignee: "+assignee);
	return this;
}
