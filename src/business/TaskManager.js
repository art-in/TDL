var Task = require('../model/Task.js').Task;
var DbContext = require('../data/DbContext.js');

//----------------------------------------------------
// Returns list of task currently exist in the system.
//----------------------------------------------------
exports.getTasks = function (callback) {
    DbContext.getTasks(callback);
}

//----------------------------------------------------
// Adds new task to the system.
//----------------------------------------------------
exports.addTask = function (description, callback) {
    var newTask = new Task(description);
    DbContext.addTask(newTask, callback);
}

//----------------------------------------------------
// Deletes task from the system.
//----------------------------------------------------
exports.deleteTask = function (taskId, callback) {
    DbContext.deleteTask(taskId, callback)
}