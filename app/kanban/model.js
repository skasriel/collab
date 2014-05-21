'use strict';
function Kanban(name, numberOfColumns) {
	this.name = name;
	this.numberOfColumns = numberOfColumns;
	this.columns = [];
	console.log("created kanban: "+name+" "+numberOfColumns);
	/*return {
		name: name,
		numberOfColumns: numberOfColumns,
		columns: []
	};*/
}

function KanbanColumn(name){
	return {
		name: name,
		cards: []
	};
}

function KanbanCard(name, details, color) {
	this.name = name;
	this.details = details;
	this.color = color;
	console.log("created card: "+name+" "+details+" "+color);
	return this;
}
