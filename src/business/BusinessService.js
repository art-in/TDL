var taskManager = require('./TaskManager.js');

//----------------------------------------------------
// Returns list of task currently exist in the system.
//----------------------------------------------------
exports.getTasks = function () {
    return taskManager.getTasks();
}

//----------------------------------------------------
// Adds new task to the system.
//----------------------------------------------------
exports.addTask = function (description) {
    taskManager.addTask(description);
}

//----------------------------------------------------
// Deletes task from the system.
//----------------------------------------------------
exports.deleteTask = function (taskId) {
    taskManager.deleteTask(taskId);
}