var logger = require('../../lib/log/Logger').logger,
    storage = require('../../data/storage'),
    co = require('../../lib/node_modules/co/index'),
    helpers = require('../../lib/server.helpers.js');

async function request(request, response, url) {
    
    var query = url.query;
    var result;

    switch (url.pathname) {
    case '/api/getTasks':
        result = await storage.getTasks();
        break;

    case '/api/addTask':
        helpers.checkArgs([
            { val: query.newTask, message: 'New task should be specified' }
        ]);
        
        result = await storage.addTask(query.newTask);
        break;

    case '/api/updateTask':
        helpers.checkArgs([
            { val: query.taskId, message: 'Task ID should be specified' },
            { val: query.properties, message: 'Properties should be specified' }
        ]);
        
        result = await storage.updateTask(query.taskId, query.properties);
        break;

    case '/api/deleteTask':
        helpers.checkArgs([
            { val: query.taskId, message: 'Task ID should be specified' }
        ]);
        
        result = await storage.deleteTask(query.taskId);
        break;
    
    case '/api/getProjects':
        result = await storage.getProjects();
        break;
        
    case '/api/addProject':
        helpers.checkArgs([
            { val: query.newProject, message: 'New project should be specified' }
        ]);
        
        result = await storage.addProject(query.newProject);
        break;

    case '/api/updateProject':
        helpers.checkArgs([
            { val: query.projectId, message: 'Project ID should be specified' },
            { val: query.properties, message: 'Properties should be specified' }
        ]);
        
        result = await storage.updateProject(query.projectId, query.properties);
        break;

    case '/api/deleteProject':
        helpers.checkArgs([
            { val: query.projectId, message: 'Project ID should be specified' }
        ]);
        
        result = await storage.deleteProject(query.projectId);
        break;
    
    default:
        throw "Not Found";
    }

    if (result) {
        helpers.respondWithJson(request, response, url.pathname, result);
    } else {
        helpers.respond(response, url.pathname);
    }
}

module.exports = {
    request: request
};
