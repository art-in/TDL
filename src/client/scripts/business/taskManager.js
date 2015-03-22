define(['data/storage', 'models/Task'],
    function(storage, Task) {

        var exports = {};

        /**
         * Returns list of task that currently exist in the system.
         *
         * @param {function} callback - Delivers fresh server state
         * @returns Local state of tasks
         */
        exports.getTasks = function (callback) {
            return storage.getTasks(function (error, tasks) {
                if (error) return; // Do not pass storage errors on higher levels for now

                callback(tasks);
            });
        };

        /**
         * Adds new task to the system.
         *
         * @param {string} description
         * @returns {Task[]} Local state of tasks
         */
        exports.addTask = function (description) {
            if (!description)
                throw new Error('Invalid description: ' + description);

            var newTask = new Task(description);
            newTask.position = 0;
            newTask.progress = 0;

            return storage.addTask(newTask);
        };

        /**
         * Deletes task from the system.
         *
         * @param {string} taskId
         * @returns Local state of tasks
         */
        exports.deleteTask = function (taskId) {
            return storage.deleteTask(taskId);
        };

        /**
         * Moves task to new position.
         *
         * @param {string} taskId
         * @param {number} newPosition
         * @returns Local state of tasks
         */
        exports.moveTask = function (taskId, newPosition) {
            if (newPosition === undefined || typeof newPosition !== 'number')
                throw new Error('Invalid new position: ' + newPosition);

            return storage.updateTask(taskId, {position: newPosition});
        };

        /**
         * Updates task properties.
         *
         * @param {string} taskId
         * @param {Object} properties
         * @returns Local state of tasks
         */
        exports.updateTask = function (taskId, properties) {
            // Validate properties
            var propertyNames = Object.getOwnPropertyNames(properties);
            if (propertyNames.length === 0) {
                throw Error('No task properties to update');
            }

            var validPropertyNames = Object.getOwnPropertyNames(new Task());
            propertyNames.forEach(function (prop) {
                if (validPropertyNames.indexOf(prop) === -1) {
                    throw Error('Unknown task property to update: ' + prop);
                }
            });

            // Convert types
            properties = Task.prototype.adjustTypes.call(null, properties);

            return storage.updateTask(taskId, properties);
        };

        return exports;
    });