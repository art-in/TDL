var Task = require('../model/Task.js').Task;

//----------------------------------------------------
// Returns list of task currently exist in the system.
//----------------------------------------------------
exports.getTasks = function () {
    // TODO: Get tasks through DAL.

    var fakeTasks = [
        new Task(1, 'This is my first task.'),
        new Task(2, 'This is my second task.'),
        new Task(3, 'My third task. And this is great!!!')];

    return fakeTasks;
}

//----------------------------------------------------
// Adds new task to the system.
//----------------------------------------------------
exports.addTask = function (description) {
    // TODO: Add new task through DAL.
}

//----------------------------------------------------
// Deletes task from the system.
//----------------------------------------------------
exports.deleteTask = function (taskId) {
    // TODO: Delete existing task through DAL.
}