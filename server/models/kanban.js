var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

console.log("registering Kanban schema");
/*
'use strict';
function Kanban(name, numberOfColumns) {
  return {
    name: name,
    numberOfColumns: numberOfColumns,
    columns: []
  };
}

function KanbanColumn(name){
  return {
    name: name,
    cards: []
  };
}

function KanbanCard(name, details, color){

*/

var KanbanCardSchema = new Schema({
  name:     {type: String, required: true, trim: true},
  details:  {type: String, required: false, trim: true},
  color:    {type: String, required: true, trim: true}
});
module.exports.KanbanCard = mongoose.model('KanbanCard', KanbanCardSchema);
module.exports.KanbanCardSchema = KanbanCardSchema;

var KanbanColumnSchema = new Schema({
  name:             {type: String, required: true, trim: true},
  //cards: [ {type: Schema.ObjectId, ref: 'KanbanCardSchema'} ],
  cards: [KanbanCardSchema]
});
module.exports.KanbanColumn = mongoose.model('KanbanColumn', KanbanColumnSchema);
module.exports.KanbanColumnSchema = KanbanColumnSchema;

var KanbanSchema = new Schema({
/*  workroom:         {type: Schema.ObjectId, ref: 'WorkroomSchema'},  */
  name:             {type: String, required: true, trim: true},
  numberOfColumns:  {type: Number, required: true},
  columns:          [KanbanColumnSchema]
  /* columns: [{type: Schema.ObjectId, ref: 'KanbanColumnSchema'} ]*/
});
module.exports.Kanban = mongoose.model('Kanban', KanbanSchema);
module.exports.KanbanSchema = KanbanSchema;




console.log("registered kanban schema: "+KanbanSchema);
