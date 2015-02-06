var MongoClient = require('../lib/node_modules/mongodb').MongoClient,
    ObjectID = require('../lib/node_modules/mongodb').ObjectID,
    config = require('../lib/config').config,
    logger = require('../lib/log/Logger').logger,
    DatabaseLM = require('../lib/log/messages/DatabaseLogMessage').message,
    DatabaseLMTypes = require('../lib/log/messages/DatabaseLogMessageTypes').types;

var connectionString = config.get('database:connectionString');

var TASKS_COLLECTION = "Tasks";

/**
 * Adds new task to the data storage.
 * 
 * @param {Task} newTask
 * @param {function} callback
 */
exports.addTask = function (newTask, callback) {
    MongoClient.connect(connectionString, function (err, db) {
        if (err) throw err;

        db.collection(TASKS_COLLECTION).insert(
            newTask,
            function (err, records) {
                if (err) throw err;
                logger.log(new DatabaseLM(DatabaseLMTypes.AddTask,
                    {taskId: records[0]._id}));
                callback(records[0]);
                db.close();
            });
    });
};

/**
 * Returns all tasks exist in the data storage.
 * 
 * @param {function} callback
 */
exports.getTasks = function (callback) {
    MongoClient.connect(connectionString, function (err, db) {
        if (err) throw err;

        db.collection(TASKS_COLLECTION)
            .find()
            .sort({position: 1})
            .toArray(
            function (err, tasks) {
                if (err) throw err;
                logger.log(new DatabaseLM(DatabaseLMTypes.GetTasks,
                    {taskCount: tasks.length}));
                callback(tasks);
                db.close();
            });
    });
};

/**
 * Returns one existing task from the data storage.
 * 
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {function} callback
 */
exports.getTask = function (taskId, callback) {
    MongoClient.connect(connectionString, function (err, db) {
        if (err) throw err;

        db.collection(TASKS_COLLECTION)
            .findOne(
            {_id: ObjectID(taskId)},
            function (err, task) {
                if (err) throw err;
                logger.log(new DatabaseLM(DatabaseLMTypes.GetTask,
                    {taskId: taskId}));
                callback(task);
                db.close();
            });
    });
};

/**
 * Updates existing task.
 * 
 * @param {Task} - Existing task with updated properties
 * @param {function} callback
 * or
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {Object} properties
 * @param {function} callback
 */
exports.updateTask = function () {
    if (typeof arguments[0] == 'object') {
        updateTaskEntirely.apply(null, arguments);
    }
    else {
        updateTaskProperties.apply(null, arguments);
    }
};

/**
 * Updates existing task entirely.
 * 
 * @param {Task} - Existing task with updated properties
 * @param {function} callback
 */
function updateTaskEntirely(task, callback) {
    MongoClient.connect(connectionString, function (err, db) {
        if (err) throw err;

        db.collection(TASKS_COLLECTION).save(
            task,
            function (err) {
                if (err) throw err;
                logger.log(new DatabaseLM(DatabaseLMTypes.UpdateTask,
                    {taskId: task._id,
                     description: task.description,
                     position: task.position,
                     progress: task.progress}));
                callback();
                db.close();
            });
    });
}

/**
 * Updates properties of existing task.
 * 
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {Object} properties
 * @param {function} callback
 */
function updateTaskProperties(taskId, properties, callback) {
    MongoClient.connect(connectionString, function (err, db) {
        if (err) throw err;
        
        db.collection(TASKS_COLLECTION).update(
            {_id: ObjectID(taskId)},
            {$set: properties},
            function(err) {
                if (err) throw err;
                
                properties.taskId = taskId;
                
                logger.log(new DatabaseLM(DatabaseLMTypes.UpdateTask, properties));
                callback();
                db.close();
            }
        );
    });
}

/**
 * Deletes task from the data storage.
 * 
 * @param {string} taskId - Mongo ObjectId hex string
 * @param {function} callback
 */
exports.deleteTask = function (taskId, callback) {
    MongoClient.connect(connectionString, function (err, db) {
        if (err) throw err;

        db.collection(TASKS_COLLECTION).remove(
            {_id: ObjectID(taskId)},
            function (err) {
                if (err) throw err;
                logger.log(new DatabaseLM(DatabaseLMTypes.DeleteTask,
                    {taskId: taskId}));
                callback();
                db.close();
            });
    });
};

/**
 * Shifts position of tasks in certain range to specified value.
 * 
 * @param {number} startPosition
 * @param {number} endPosition
 * @param {number} shift - number of positions to move
 *                         positive number to move further, negavive - to move backwards
 * @param {function} callback
 */
exports.shiftTaskPositions = function (startPosition, endPosition, shift, callback) {
    startPosition = startPosition != null ? startPosition : 0;
    endPosition = endPosition != null ? endPosition : Number.MAX_VALUE;

    MongoClient.connect(connectionString, function (err, db) {
        if (err) throw err;

        db.collection(TASKS_COLLECTION).update(
            {position: {$gte: startPosition, $lte: endPosition}},
            {$inc: {position: shift}},
            {multi: true},
            function (err) {
                if (err) throw err;
                logger.log(new DatabaseLM(DatabaseLMTypes.ShiftTaskPositions,
                    {startPosition: startPosition, endPosition: endPosition, shift: shift}));
                callback();
                db.close();
            });
    });
};
