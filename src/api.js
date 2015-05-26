var storage = require('./data/storage'),
    co = require('./lib/node_modules/co');

function request(requestPath, query) {
    return co(function*() {
        
        switch (requestPath) {
        case '/api/getTasks':
            return yield storage.getTasks();
    
        case '/api/addTask':
            checkArgs([
                { val: query.newTask, message: 'New task should be specified' }
            ]);
            
            return yield storage.addTask(query.newTask);
    
        case '/api/updateTask':
            checkArgs([
                { val: query.taskId, message: 'Task ID should be specified' },
                { val: query.properties, message: 'Properties should be specified' }
            ]);
            
            return yield storage.updateTask(query.taskId, query.properties);
    
        case '/api/deleteTask':
            checkArgs([
                { val: query.taskId, message: 'Task ID should be specified' }
            ]);
            
            return yield storage.deleteTask(query.taskId);
        
        case '/api/getProjects':
            return yield storage.getProjects();
            
        case '/api/addProject':
            checkArgs([
                { val: query.newProject, message: 'New project should be specified' }
            ]);
            
            return yield storage.addProject(query.newProject);
    
        case '/api/updateProject':
            checkArgs([
                { val: query.projectId, message: 'Project ID should be specified' },
                { val: query.properties, message: 'Properties should be specified' }
            ]);
            
            return yield storage.updateProject(query.projectId, query.properties);
    
        case '/api/deleteProject':
            checkArgs([
                { val: query.projectId, message: 'Project ID should be specified' }
            ]);
            
            return yield storage.deleteProject(query.projectId);
        
        default:
            throw "Not Found";
        }
    });  
}

module.exports = {
    request: request
};

/**
 * Throws error if one of arguments is not specified (undefined, '', {}).
 * 
 * @param {ServerResponse} response
 * @param {Object[]} args
 * @param            args.val - value of argument (should not be undefined)
 * @param            args.message - error message if value is undefined
 */
function checkArgs(args) {
    args.forEach(function (arg) {
        if (arg.val === undefined || arg.val === '' ||
           (typeof arg.val === 'object' && Object.keys(arg.val).length === 0)) {
           throw arg.message; 
        }
    });
}