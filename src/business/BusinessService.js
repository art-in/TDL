// Represents interface to business layer.

var taskManager = require('./TaskManager.js');

//----------------------------------------------------
// Returns list of task currently exist in the system.
//----------------------------------------------------
exports.getTasks = function (callback) {
    return taskManager.getTasks(callback);
}

//----------------------------------------------------
// Adds new task to the system.
//----------------------------------------------------
exports.addTask = function (description, callback) {
    taskManager.addTask(description, callback);
}

//----------------------------------------------------
// Deletes task from the system.
//----------------------------------------------------
exports.deleteTask = function (taskId, callback) {
    taskManager.deleteTask(taskId, callback);
}

//----------------------------------------------------
// Moves task to new position.
//----------------------------------------------------
exports.moveTask = function (taskId, newPosition, callback) {
    taskManager.moveTask(taskId, newPosition, callback);
}