var logger = require('../../lib/log/Logger').logger,
    storage = require('../../data/storage'),
    co = require('../../lib/node_modules/co/index'),
    helpers = require('../../lib/server.helpers.js');

function request(request, response, url) {
    return co(function*() {

        var query = url.query;

        switch (url.pathname) {
        case '/api/getTasks':
            return yield storage.getTasks();
    
        case '/api/addTask':
            helpers.checkArgs([
                { val: query.newTask, message: 'New task should be specified' }
            ]);
            
            return yield storage.addTask(query.newTask);
    
        case '/api/updateTask':
            helpers.checkArgs([
                { val: query.taskId, message: 'Task ID should be specified' },
                { val: query.properties, message: 'Properties should be specified' }
            ]);
            
            return yield storage.updateTask(query.taskId, query.properties);
    
        case '/api/deleteTask':
            helpers.checkArgs([
                { val: query.taskId, message: 'Task ID should be specified' }
            ]);
            
            return yield storage.deleteTask(query.taskId);
        
        case '/api/getProjects':
            return yield storage.getProjects();
            
        case '/api/addProject':
            helpers.checkArgs([
                { val: query.newProject, message: 'New project should be specified' }
            ]);
            
            return yield storage.addProject(query.newProject);
    
        case '/api/updateProject':
            helpers.checkArgs([
                { val: query.projectId, message: 'Project ID should be specified' },
                { val: query.properties, message: 'Properties should be specified' }
            ]);
            
            return yield storage.updateProject(query.projectId, query.properties);
    
        case '/api/deleteProject':
            helpers.checkArgs([
                { val: query.projectId, message: 'Project ID should be specified' }
            ]);
            
            return yield storage.deleteProject(query.projectId);
        
        default:
            throw "Not Found";
        }
    })
    .then(function(result) {
        if (result) {
            helpers.respondWithJson(request, response, url.pathname, result);
        } else {
            helpers.respond(response, url.pathname);
        }
    });
}

module.exports = {
    request: request
};
