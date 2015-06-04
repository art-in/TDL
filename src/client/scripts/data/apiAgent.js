define(['lib/RequestQueue'], function(RequestQueue) {

    var requestQueue = new RequestQueue();

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

    function getTasks () {
        return queue({
            url: apiMethods.getTasks,
            tail: true
        });
    }

    function addTask (newTask) {
        return queue({
            url: apiMethods.addTask,
            params: {
                newTask: newTask
            }
        });
    }

    function updateTask (taskId, properties) {
        return queue({
            url: apiMethods.updateTask,
            params: {
                taskId: taskId,
                properties: properties
            }
        });
    }

    function deleteTask (taskId) {
        return queue({
            url: apiMethods.deleteTask,
            params: {
                taskId: taskId
            }
        });
    }

    function getProjects () {
        return queue({
            url: apiMethods.getProjects,
            tail: true
        });
    }
    
    function addProject (newProject) {
        return queue({
            url: apiMethods.addProject,
            params: {
                newProject: newProject
            }
        });
    }

    function updateProject (projectId, properties) {
        return queue({
            url: apiMethods.updateProject,
            params: {
                projectId: projectId,
                properties: properties
            }
        });
    }

    function deleteProject (projectId) {
        return queue({
            url: apiMethods.deleteProject,
            params: {
                projectId: projectId
            }
        });
    }
    
    /**
     * Adds request to the queue.
     *
     * Why queuing server requests?
     * Because order of API calls is crucial here:
     * ie. task updates should not outrace its deletion.
     * While calls is beeing made in right order, it is not guaranteed
     * that they will be delivered to the server in the same order.
     * E.g. network connection is bad. Several ajax requests initiated in A B C order.
     * But there was no luck for request A and B - they had too many packet drops,
     * while parallel request C was much better to establish server connection
     * earlier and so deliver request faster. Now server received requests in C B A order.
     * To ensure that order of requests delivered to the server is right,
     * we should wait for request A round trip, and only then send request B, and so on.
     * Which means request A should be fully done (not just response head received,
     * because if response body corrupted then we should retry).
     * Sequential sending will be slower than several parallel requests,
     * but I do not see other way for now.
     *
     * @param {Object} request description
     * @return {Promise} that will be resolved when request done.
     * */
    function queue(request) {
        var resolve, reject;

        requestQueue.push(request, function(err, result) {
            if (err) { reject(err); } 
            else { resolve(result && JSON.parse(result)); }
        });

        return new Promise(function(res, rej) {
            resolve = res; reject = rej;
        });
    }

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