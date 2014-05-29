'use strict';
var MPK = angular.module('mpk.services',[]);

MPK.factory('kanbanManipulator', function () {
  return {
    addColumn: function(kanban, columnName){
      kanban.columns.push(new KanbanColumn(columnName));
    },

    addCardToColumn: function(kanban, column, cardTitle, details, color, assignee) {
      console.log("adding to column with assignee = "+assignee);
      angular.forEach(kanban.columns, function(col){
        if (col.name === column.name){
          col.cards.push(new KanbanCard(cardTitle, details, color, assignee));
        }
      });
    },
    removeCardFromColumn: function(kanban, column, card) {
      angular.forEach(kanban.columns, function(col){
        if (col.name === column.name){
          col.cards.splice(col.cards.indexOf(card), 1);
        }
      });
    }
  };
});
