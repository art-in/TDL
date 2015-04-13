define(['lib/transport/RequestQueue'], function(RequestQueue) {

    /**
     * Server API methods.
     */
    var apiMethods = {
        getTasks: '/api/getTasks',
        addTask: '/api/addTask',
        updateTask: '/api/updateTask',
        deleteTask: '/api/deleteTask',
        
        getProjects: '/api/getProjects',
        addProject: '/api/addProject',
        updateProject: '/api/updateProject',
        deleteProject: '/api/deleteProject'
    };

    function getTasks (cb) {
        requestQueue.push({
            url: apiMethods.getTasks,
            tail: true
        }, cb);
    }

    function addTask (newTask) {
        requestQueue.push({
            url: apiMethods.addTask,
            params: {
                newTask: newTask
            }
        });
    }

    function updateTask (taskId, properties) {
        requestQueue.push({
            url: apiMethods.updateTask,
            params: {
                taskId: taskId,
                properties: properties
            }
        });
    }

    function deleteTask (taskId) {
        requestQueue.push({
            url: apiMethods.deleteTask,
            params: {
                taskId: taskId
            }
        });
    }

    function getProjects (cb) {
        requestQueue.push({
            url: apiMethods.getProjects,
            tail: true
        }, cb);
    }
    
    function addProject (newProject) {
        requestQueue.push({
            url: apiMethods.addProject,
            params: {
                newProject: newProject
            }
        });
    }

    function updateProject (projectId, properties) {
        requestQueue.push({
            url: apiMethods.updateProject,
            params: {
                projectId: projectId,
                properties: properties
            }
        });
    }

    function deleteProject (projectId) {
        requestQueue.push({
            url: apiMethods.deleteProject,
            params: {
                projectId: projectId
            }
        });
    }
    
    /* Order of API calls is crucial here (i.e. task updates should not outrace its deletion).
       While calls is beeing made in right order, it is not guaranteed
       that they will be delivered to the server in the same order.
       E.g. network connection is bad. Several ajax requests initiated in A B C order.
       But there was no luck for request A and B - they had too many packet drops,
       while parallel request C was much better to establish server connection
       earlier and so deliver request faster. Now server received requests in C B A order.
       To ensure that order of requests delivered to the server is right,
       we should wait for request A round trip, and only then send request B, and so on.
       Which means request A should be fully done (not just response head received -
       if response corrupted we should retry).
       Sequential sending will be slower than several parallel requests,
       but I do not see other way for now. */
    var requestQueue = new RequestQueue();

    return {
        getTasks: getTasks,
        addTask: addTask,
        updateTask: updateTask,
        deleteTask: deleteTask,
        
        getProjects: getProjects,
        addProject: addProject,
        updateProject: updateProject,
        deleteProject: deleteProject
    };
});