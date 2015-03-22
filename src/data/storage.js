var MongoClient = require('../lib/node_modules/mongodb').MongoClient,
    ObjectID = require('../lib/node_modules/mongodb').ObjectID,
    Queue = require('Queue').Queue,
    config = require('../lib/config').config,
    logger = require('../lib/log/Logger').logger,
    DatabaseLM = require('../lib/log/messages/DatabaseLogMessage').message,
    DatabaseLMTypes = require('../lib/log/messages/DatabaseLogMessageTypes').types;

var connectionString = config.get('database:connectionString'),
    TASKS_COLLECTION = "tasks";

var db;

var queue = new Queue();

/**
 * Returns all tasks exist in the data storage.
 *
 * @param {function} cb
 */
exports.getTasks = function (cb) {
    queueDb(cb, function (cb) {
        db.collection(TASKS_COLLECTION)
            .find()
            .sort({position: 1})
            .toArray(
            function (err, tasks) {
                if (err) throw err;

                // Cut out db ids
                tasks.map(function(task) {
                    delete task._id;
                });

                logger.log(new DatabaseLM(DatabaseLMTypes.GetTasks,
                    {taskCount: tasks.length}));
                cb(false, tasks);
            });
    });
};

/**
 * Adds new task to the data storage.
 *
 * @param {Task} newTask
 * @param {function} cb
 */
exports.addTask = function (newTask, cb) {
    queueDb(cb, function (cb) {
        var taskPosition = newTask.position;

        shiftTaskPositions(taskPosition, null, 1, function () {
            db.collection(TASKS_COLLECTION).insert(
                newTask,
                function (err, records) {
                    if (err) throw err;

                    logger.log(new DatabaseLM(DatabaseLMTypes.AddTask,
                        {taskId: records[0].id}));
                    cb(false);
                });
        });
    });
};

/**
 * Updates properties of existing task.
 *
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {Object} properties
 * @param {function} cb
 */
exports.updateTask = function (taskId, properties, cb) {
    queueDb(cb, function (cb) {

        getTask(taskId, function (error, task) {
            if (error) {
                cb(error);
                return
            }

            if (properties.position !== undefined) {
                // If changing task position - first shift other tasks

                var newPosition = properties.position;
                var oldPosition = task.position;
                var movedDown = newPosition > oldPosition;

                shiftTaskPositions(
                    movedDown ? oldPosition + 1 : newPosition,
                    movedDown ? newPosition : oldPosition - 1,
                    movedDown ? -1 : 1,
                    function () {
                        updateTaskProperties(taskId, properties);
                    });
            } else {
                updateTaskProperties(taskId, properties);
            }
        });


        // Updates properties of the task
        function updateTaskProperties(taskId, properties) {
            db.collection(TASKS_COLLECTION).update(
                {id: taskId},
                {$set: properties},
                function (err) {
                    if (err) throw err;

                    properties.taskId = taskId;

                    logger.log(new DatabaseLM(DatabaseLMTypes.UpdateTaskProperties, properties));
                    cb(false);
                }
            )
        }
    });
};

/**
 * Deletes task from the data storage.
 *
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {function} cb
 */
exports.deleteTask = function (taskId, cb) {
    queueDb(cb, function (cb) {

        // Get target task
        getTask(taskId, function (error, task) {
            if (error) {
                cb(error);
                return;
            }

            var taskPosition = task.position;

            // Shift positions or all tasks below one position up
            shiftTaskPositions(taskPosition, null, -1, function () {

                // Remove the task itself
                db.collection(TASKS_COLLECTION).remove(
                    {id: taskId},
                    function (err) {
                        if (err) throw err;

                        logger.log(new DatabaseLM(DatabaseLMTypes.DeleteTask,
                            {taskId: taskId}));
                        cb(false);
                    });
            });
        })
    });
};

// Connect to database.
(function () {
    MongoClient.connect(connectionString,
        function (err, dbContext) {
            if (err) throw err;
            db = dbContext;
        });
})();

/**
 * Adds DB job to the queue.
 *
 * Why self-made queue?
 * Because MongoDB supports transaction atomicity on document level only
 * (not collection level). Updating bunch of documents in collection
 * can be mixed with other operations (insert/update/delete) by DB itself.
 * Sometimes such behaviour is not acceptable. E.g. when updating
 * existing documents in collection must precede adding new ones.
 * To be sure that each bunch update executed as one transaction
 * all db jobs should go through one queue and executed one after another.
 * TODO: probably it makes sense to create one queue per user.
 * @param cb
 * @param jobDb
 */
function queueDb(cb, jobDb) {
    return queue.push.apply(queue, arguments)
}

/**
 * Gets existing task by id.
 *
 * @param taskId
 * @param cb
 */
function getTask(taskId, cb) {
    db.collection(TASKS_COLLECTION)
        .find({id: taskId})
        .toArray(function (err, tasks) {
            if (err) throw err;
            if (tasks.length === 0) {
                var errorMessage = 'No task with such id found: ' + taskId;
                console.warn(errorMessage);
                cb(errorMessage);
                return;
            }

            logger.log(new DatabaseLM(DatabaseLMTypes.GetTask,
                {taskId: taskId}));


            cb(false, tasks[0]);
        })
}

/**
 * Shifts position of tasks in certain range to specified value.
 *
 * @param {number} startPosition
 * @param {number} endPosition
 * @param {number} shift - number of positions to move
 *                         positive number to move further, negavive - to move backwards
 * @param {function} cb
 */
function shiftTaskPositions(startPosition, endPosition, shift, cb) {
    startPosition = startPosition != null ? startPosition : 0;
    endPosition = endPosition != null ? endPosition : Number.MAX_VALUE;

    db.collection(TASKS_COLLECTION).update(
        {position: {$gte: startPosition, $lte: endPosition}},
        {$inc: {position: shift}},
        {multi: true},
        function (err) {
            if (err) throw err;

            logger.log(new DatabaseLM(DatabaseLMTypes.ShiftTaskPositions,
                {startPosition: startPosition, endPosition: endPosition, shift: shift}));
            cb();
        });
}
