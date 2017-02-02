var MongoClient = require('../lib/node_modules/mongodb').MongoClient,
    Promise = require('../lib/node_modules/bluebird').Promise,
    co = require('../lib/node_modules/co'),
    Queue = require('../lib/Queue').Queue,
    config = require('../lib/config').config,
    logger = require('../lib/log/Logger').logger,
    DatabaseLM = require('../lib/log/messages/DatabaseLogMessage').message,
    DatabaseLMTypes = require('../lib/log/messages/DatabaseLogMessageTypes').types;

var USER_COLLECTION = "users",
    TASK_COLLECTION = "tasks",
    PROJECT_COLLECTION = "projects";

var db;

var jobQueue = new Queue();

function getUser (userName) {
    return queue(async function() {
        var col = await db.collection(USER_COLLECTION);
        var user = await col
            .findOne({name: userName}, {_id:0});

        if (!user) {
            throw Error('No user with such name found: ' + userName)
        }

        logger.log(new DatabaseLM(DatabaseLMTypes.GetUser,
            {user: JSON.stringify(user, ['name'])}));

        return user;
    });
}

/**
 * Returns all tasks exist in the data storage.
 * @returns {Promise}
 */
function getTasks () {
    return queue(async function() {
        var col = await db.collection(TASK_COLLECTION);
        var tasks = await col
            .find({}, {_id:0})
            .sort({position: 1})
            .toArray();
            
        logger.log(new DatabaseLM(DatabaseLMTypes.GetTasks,
            {taskCount: tasks.length}));
            
        return tasks;
    });
}

/**
 * Adds new task to the data storage.
 *
 * @param {Task} newTask
 * @returns {Promise}
 */
function addTask (newTask) {
    return queue(async function() {
        
        await shiftTaskPositions(newTask.position, null, 1);
        
        var col = await db.collection(TASK_COLLECTION);
        var res = await col.insert(newTask);

        logger.log(new DatabaseLM(DatabaseLMTypes.AddTask,
            {taskId: res.ops[0].id}));
    });
}

/**
 * Updates properties of existing task.
 *
 * @param {string} taskId
 * @param {Object} properties
 * @returns {Promise}
 */
function updateTask (taskId, properties) {
    return queue(async function() {
        
        var task = await getTask(taskId);
        
        // If changing task position - first shift tasks below
        if (properties.position !== undefined) {
            var newPosition = properties.position;
            var oldPosition = task.position;
            var movedDown = newPosition > oldPosition;

            await shiftTaskPositions(
                movedDown ? oldPosition + 1 : newPosition,
                movedDown ? newPosition : oldPosition - 1,
                movedDown ? -1 : 1);
        }

        var col = await db.collection(TASK_COLLECTION);
        await col.update(
            {id: taskId},
            {$set: properties});
            
        properties.taskId = taskId;
        logger.log(new DatabaseLM(DatabaseLMTypes.UpdateTask, properties));
    });
}

/**
 * Deletes task from the data storage.
 *
 * @param {string} taskId
 * @returns {Promise}
 */
function deleteTask (taskId) {
    return queue(async function() {

        var task = await getTask(taskId);

        // Shift positions or all tasks below one position up
        await shiftTaskPositions(task.position, null, -1);
        
        var col = await db.collection(TASK_COLLECTION);
        await col.remove({id: taskId});

        logger.log(new DatabaseLM(DatabaseLMTypes.DeleteTask,
            {taskId: taskId}));
    });
}

/**
 * Returns all projects exist in the data storage.
 * @returns {Promise}
 */
function getProjects () {
    return queue(async function() {
        
        var col = await db.collection(PROJECT_COLLECTION);
        var projects = await col.find({}, {_id:0}).toArray();

        logger.log(new DatabaseLM(DatabaseLMTypes.GetProjects,
                 {projectCount: projects.length}));
                 
        return projects;
    });
}

/**
 * Adds new project to the data storage.
 *
 * @param {Project} newProject
 * @returns {Promise}
 */
function addProject (newProject) {
    return queue(async function() {
        
        var col = await db.collection(PROJECT_COLLECTION);
        var res = await col.insert(newProject);
        
        logger.log(new DatabaseLM(DatabaseLMTypes.AddProject,
            {projectId: res.ops[0].id}));
    });
}

/**
 * Updates properties of existing project.
 *
 * @param {string} projectId
 * @param {Object} properties
 * @returns {Promise}
 */
function updateProject (projectId, properties) {
    return queue(async function() {
        
        var col = await db.collection(PROJECT_COLLECTION);
        await col.update(
            {id: projectId},
            {$set: properties});
            
        properties.projectId = projectId;
        logger.log(new DatabaseLM(DatabaseLMTypes.UpdateProject, properties));
    });
}

/**
 * Deletes project from the data storage.
 *
 * @param {string} projectId
 * @returns {Promise}
 */
function deleteProject (projectId) {
    return queue(async function() {
        
        var col = await db.collection(PROJECT_COLLECTION);
        await col.remove({id: projectId});
            
        logger.log(new DatabaseLM(DatabaseLMTypes.DeleteProject,
            {projectId: projectId}));
    });
}

module.exports = {
    getUser: getUser,

    getTasks: getTasks,
    addTask: addTask,
    updateTask: updateTask,
    deleteTask: deleteTask,
    
    getProjects: getProjects,
    addProject: addProject,
    updateProject: updateProject,
    deleteProject: deleteProject
};

//region Private methods

// Connect to the database.
(async function connect() {
    db = await MongoClient.connect(config.get('database:connectionString'));
})();

/**
 * Adds DB job to the queue.
 *
 * Why self-made queue?
 * 1. Because MongoDB supports transaction atomicity on document level only
 * (not collection level). Updating bunch of documents in collection
 * can be mixed with other operations (insert/update/delete) by DB itself.
 * Sometimes such behaviour is not acceptable. E.g. when updating
 * existing documents in collection must precede adding new ones.
 * 2. More than that, sometimes we need atomisity not only on level of one operation,
 * but on level of group of several operations. E.g. to make update, then insert,
 * and to be sure no other operations injected between them.
 * To make sure no operations are mixed up, all db jobs should go through one queue
 * and be executed one after another.
 * TODO: probably it makes sense to create one queue per user.
 * @param {async function} job
 * @return {Promise} that will be resolved when job done.
 */
function queue(job) {
    var resolve, reject;
    
    jobQueue.push(function(cb) {
        job().then(function(result) {
            resolve(result);
            cb();
        }).catch(function (error) {
            reject(error);
            cb();
        });
    });
    
    return new Promise(function(res, rej) {
        resolve = res;
        reject = rej;
    });
}

/**
 * Gets existing task by id.
 *
 * @param taskId
 * @return {promise.<Task>}
 */
async function getTask(taskId) {
    var col = await db.collection(TASK_COLLECTION);
    var tasks = await col
        .find({id: taskId})
        .toArray();
    
    if (tasks.length === 0) {
        throw 'No task with such id found: ' + taskId;
    }

    logger.log(new DatabaseLM(DatabaseLMTypes.GetTask,
        {taskId: taskId}));
        
    return tasks[0];
}

/**
 * Shifts position of tasks in certain range to specified value.
 *
 * @param {number} startPosition
 * @param {number} endPosition
 * @param {number} shift - number of positions to move
 *                         positive number to move up, negavive - to move down
 * @returns {promise}
 */
async function shiftTaskPositions(startPosition, endPosition, shift) {
    startPosition = startPosition !== null ? startPosition : 0;
    endPosition = endPosition !== null ? endPosition : Number.MAX_VALUE;
    
    var col = await db.collection(TASK_COLLECTION);
    
    await col.update(
        {position: {$gte: startPosition, $lte: endPosition}},
        {$inc: {position: shift}},
        {multi: true});
    
    logger.log(new DatabaseLM(DatabaseLMTypes.ShiftTaskPositions,
        {startPosition: startPosition, endPosition: endPosition, shift: shift}));
}

//endregion