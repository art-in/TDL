define(['lib/transport/apiAgent'],
    function(apiAgent) {

        var exports = {};

        /**
         * Returns all tasks exist in the data storage.
         *
         * @param {function} cb - Deliveres fresh server state
         * @returns Local state
         */
        exports.getTasks = function (cb) {

            var onTasksReceived = function(cb, error, tasksJson) {
                if (error) {
                    cb && cb(error);
                    return;
                }

                var tasks = JSON.parse(tasksJson);

                tasks.sort(tasksComparer);

                cb && cb(error, tasks);

                return tasks;
            };

            // Get from server
            apiAgent.getTasks(onTasksReceived.bind(null, function(error, tasks) {
                if (error) {
                    cb && cb(error);
                    return;
                }

                localStorage.tasks = JSON.stringify(tasks);
                cb(error, tasks);
            }));

            // Get locally
            initTasksIfRequired();

            return onTasksReceived(null, false, localStorage.tasks);
        };

        /**
         * Adds new task to the data storage.
         *
         * @param {Task} newTask
         * @returns Local state
         */
        exports.addTask = function (newTask) {
            // Add to server
            apiAgent.addTask(newTask);

            // Add locally
            initTasksIfRequired();

            var taskPosition = newTask.position;

            var tasks = shiftTaskPositions(taskPosition, null, 1);

            tasks.push(newTask);

            localStorage.tasks = JSON.stringify(tasks);

            tasks.sort(tasksComparer);

            return tasks;
        };

        /**
         * Updates properties of existing task.
         *
         * @param {string} taskId - Mongo ObjectId hex string
         * @param {Object} properties
         * @returns Local state
         */
        exports.updateTask = function (taskId, properties) {
            // Update on server
            apiAgent.updateTask(taskId, properties);

            // Update locally
            initTasksIfRequired();

            var tasks = JSON.parse(localStorage.tasks);

            var targetTask = tasks.filter(function(t) {
                return t.id === taskId;
            })[0];

            if (targetTask === undefined)
                throw new Error('Task to update was not found.');

            if (properties.position !== undefined) {
                // If changing task position - shift other tasks

                var newPosition = properties.position;

                var oldPosition = targetTask.position;
                var movedDown = newPosition > oldPosition;

                tasks = shiftTaskPositions(
                    movedDown ? oldPosition + 1 : newPosition,
                    movedDown ? newPosition : oldPosition - 1,
                    movedDown ? -1 : 1);
            }

            targetTask = tasks.filter(function(t) {
                return t.id === taskId;
            })[0];

            var propertyNames = Object.getOwnPropertyNames(properties);

            propertyNames.forEach(function(propName) {
               targetTask[propName] = properties[propName];
            });

            localStorage.tasks = JSON.stringify(tasks);

            tasks.sort(tasksComparer);

            return tasks;
        };

        /**
         * Deletes task from the data storage.
         *
         * @param {string} taskId - Mongo ObjectId hex string
         * @returns Local state
         */
        exports.deleteTask = function (taskId) {
            // Delete on server
            apiAgent.deleteTask(taskId);

            // Delete locally
            initTasksIfRequired();

            var tasks = JSON.parse(localStorage.tasks);

            var targetTask = tasks.filter(function(t) {
                return t.id === taskId;
            })[0];

            if (targetTask === undefined)
                throw new Error('Task to delete was not found.');

            // Shift positions or all tasks below one position up
            tasks = shiftTaskPositions(targetTask.position, null, -1);

            targetTask = tasks.filter(function(t) {
                return t.id === taskId;
            })[0];

            var targetTaskIndex = tasks.indexOf(targetTask);

            tasks.splice(targetTaskIndex, 1);

            localStorage.tasks = JSON.stringify(tasks);

            tasks.sort(tasksComparer);

            return tasks;
        };

        function tasksComparer(taskA, taskB) {
            if (taskA.position < taskB.position) {
                return -1;
            }

            if (taskA.position > taskB.position) {
                return 1;
            }

            return 0;
        }

        function initTasksIfRequired() {
            if (localStorage.tasks === "") {
                localStorage.tasks = JSON.stringify([]);
            }
        }

        /**
         * Shifts position of tasks in certain range to specified value.
         *
         * @param {number} startPosition
         * @param {number} endPosition
         * @param {number} shift - number of positions to move
         *                         positive number to move further, negavive - to move backwards
         * @returns Local state
         */
        function shiftTaskPositions (startPosition, endPosition, shift) {
            // Shift locally
            initTasksIfRequired();

            startPosition = startPosition != null ? startPosition : 0;
            endPosition = endPosition != null ? endPosition : Number.MAX_VALUE;

            var tasks = JSON.parse(localStorage.tasks);

            tasks.forEach(function(task) {
                if (task.position >= startPosition && task.position <= endPosition) {
                    task.position += shift;
                }
            });

            localStorage.tasks = JSON.stringify(tasks);

            tasks.sort(tasksComparer);

            return tasks;
        }

        return exports;
    });