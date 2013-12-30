// Contains task-specific business logic.

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
    newTask.Position = 0;
    newTask.Progress = 0;

    // Shift all existing tasks to one position down.
    DbContext.shiftTaskPositions(null, null, 1, function () {
        DbContext.addTask(newTask, function () {
            callback();
        });
    });
}

//----------------------------------------------------
// Deletes task from the system.
//----------------------------------------------------
exports.deleteTask = function (taskId, callback) {

    DbContext.getTask(taskId,
        function (task) {
            var taskPosition = task.Position;

            // Shift all existing task below to one position up.
            DbContext.shiftTaskPositions(taskPosition, null, -1,
                function () {
                    // Delete target task.
                    DbContext.deleteTask(taskId,
                        function () {
                            callback();
                        })
                })
        });
}

//----------------------------------------------------
// Moves task to new position.
//----------------------------------------------------
exports.moveTask = function (taskId, newPosition, callback) {
    DbContext.getTask(taskId,
        function (task) {
            var oldPosition = task.Position;
            var movedDown = newPosition > oldPosition;

            // Shift all tasks between old and new positions.
            DbContext.shiftTaskPositions(
                movedDown ? oldPosition + 1 : newPosition,
                movedDown ? newPosition : oldPosition - 1,
                movedDown ? -1 : 1,
                function () {
                    task.Position = newPosition;
                    DbContext.updateTask(task,
                        function () {
                            callback();
                        })
                });
        });
}

//----------------------------------------------------
// Sets task progress.
//----------------------------------------------------
exports.setTaskProgress = function (taskId, progress, callback) {
    DbContext.setTaskProgress(
        taskId,
        progress,
        function () {
              callback();
        });
}