var MongoClient = require('../lib/node_modules/mongodb').MongoClient;
var ObjectID = require('../lib/node_modules/mongodb').ObjectID;

var CONNECTION_STRING = "mongodb://127.0.0.1:27017/TDL";

var TASKS_COLLECTION = "Tasks";

//----------------------------------------------------
// Adds new task to the data storage.
//----------------------------------------------------
exports.addTask = function (newTask, callback) {
    MongoClient.connect(CONNECTION_STRING, function (err, db) {
        if (err) throw err;
        console.log("connected to database");

        db.collection(TASKS_COLLECTION).insert(
            newTask,
            function (err, records) {
                if (err) throw err;
                console.log("New task added as " + records[0]._id);
                callback();
                db.close();
            });
    });
}

//----------------------------------------------------
// Returns all tasks exist in the data storage.
//----------------------------------------------------
exports.getTasks = function (callback) {
    MongoClient.connect(CONNECTION_STRING, function (err, db) {
        if (err) throw err;
        console.log("connected to database");

        db.collection(TASKS_COLLECTION)
            .find()
            .sort({Position: 1})
            .toArray(
            function (err, tasks) {
                if (err) throw err;
                console.log("Returning tasks number: " + tasks.length);
                callback(tasks);
                db.close();
            });
    });
}

//----------------------------------------------------
// Returns one existing task from the data storage.
//----------------------------------------------------
exports.getTask = function (taskId, callback) {
    MongoClient.connect(CONNECTION_STRING, function (err, db) {
        if (err) throw err;
        console.log("connected to database");

        db.collection(TASKS_COLLECTION)
            .findOne(
            {_id: ObjectID(taskId)},
            function (err, task) {
                if (err) throw err;
                console.log("Returning task: " + taskId);
                callback(task);
                db.close();
            });
    });
}

//----------------------------------------------------
// Updates existing task in the system.
//----------------------------------------------------
exports.updateTask = function (task, callback) {
    MongoClient.connect(CONNECTION_STRING, function (err, db) {
        if (err) throw err;
        console.log("connected to database");

        db.collection(TASKS_COLLECTION).save(
            task,
            function (err) {
                if (err) throw err;
                console.log("Task saved: " + task._id);
                callback();
                db.close();
            });
    });
}

//----------------------------------------------------
// Deletes task from the data storage.
//----------------------------------------------------
exports.deleteTask = function (taskId, callback) {
    MongoClient.connect(CONNECTION_STRING, function (err, db) {
        if (err) throw err;
        console.log("connected to database");

        db.collection(TASKS_COLLECTION).remove(
            {"_id": ObjectID(taskId)},
            function (err) {
                if (err) throw err;
                console.log("Task was removed: " + taskId);
                callback();
                db.close();
            })
    });
}

//----------------------------------------------------
// Shifts position of tasks in certain range to specified value.
//----------------------------------------------------
exports.shiftTaskPositions = function (startPosition, endPosition, shift, callback) {
    startPosition = startPosition != null ? startPosition : 0;
    endPosition = endPosition != null ? endPosition : 1000000;

    MongoClient.connect(CONNECTION_STRING, function (err, db) {
        if (err) throw err;
        console.log("connected to database");

        db.collection(TASKS_COLLECTION).update(
            {Position: {$gte: startPosition, $lte: endPosition}},
            {$inc: {Position: shift}},
            {multi: true},
            function (err) {
                if (err) throw err;
                console.log("Tasks [" + startPosition + " ; " + endPosition + "]: shifted to " + shift);
                callback();
                db.close();
            });
    });
}