var Task = require('../model/Task.js').Task,
    DbContext = require('../data/DbContext.js');

/**
 * Returns list of task that currently exist in the system.
 * 
 * @param {function} callback
 */
exports.getTasks = function (callback) {
    DbContext.getTasks(callback);
};

/**
 * Adds new task to the system.
 * 
 * @param {string} description
 * @param {function} callback
 */
exports.addTask = function (description, callback) {
    var newTask = new Task(description);
    newTask.position = 0;
    newTask.progress = 0;

    // Shift all existing tasks one position down.
    DbContext.shiftTaskPositions(null, null, 1, function () {
        DbContext.addTask(newTask, callback);
    });
};

/**
 * Deletes task from the system.
 * 
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {function} callback
 */
exports.deleteTask = function (taskId, callback) {
    DbContext.getTask(taskId,
        function (task) {
            var taskPosition = task.position;

            // Shift all existing task below one position up.
            DbContext.shiftTaskPositions(taskPosition, null, -1,
                function () {
                    // Delete target task.
                    DbContext.deleteTask(taskId,
                        function () {
                            callback();
                        });
                });
        });
};

/**
 * Moves task to new position.
 * 
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {number} newPosition
 * @param {function} callback
 */
exports.moveTask = function (taskId, newPosition, callback) {
    DbContext.getTask(taskId,
        function (task) {
            var oldPosition = task.position;
            var movedDown = newPosition > oldPosition;

            // Shift all tasks between old and new positions.
            DbContext.shiftTaskPositions(
                movedDown ? oldPosition + 1 : newPosition,
                movedDown ? newPosition : oldPosition - 1,
                movedDown ? -1 : 1,
                function () {
                    task.position = newPosition;
                    DbContext.updateTask(task,
                        function () {
                            callback();
                        });
                });
        });
};

/**
 * Updates task properties.
 * 
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {Object} properties
 * @param {function} callback
 */
exports.updateTask = function (taskId, properties, callback) {
    // Validate properties
    var propertyNames = Object.getOwnPropertyNames(properties);
    if (propertyNames.length === 0) {
        throw Error('No task properties to update');
    }
    
    var validPropertyNames = Object.getOwnPropertyNames(new Task());
    propertyNames.forEach(function(prop) {
        if (validPropertyNames.indexOf(prop) == -1) {
            throw Error('Unknown task property to update: ' + prop);
        }
    });
    
    // Convert types
    properties = Task.prototype.adjustTypes.call(null, properties);
    
    DbContext.updateTask(
        taskId,
        properties,
        function () {
              callback();
        });
};