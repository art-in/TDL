define(['lib/transport/RequestQueue'], function(RequestQueue) {

    var exports = {};

    // Order of API calls is crucial here (i.e. task updates should not outrace its deletion).
    // While calls is beeing made in right order, it is not guaranteed
    // that they will be delivered to the server in the same order.
    // E.g. network connection is bad. Several ajax requests initiated in A B C order.
    // But there was no luck for request A and B - they had too many packet drops,
    // while parallel request C was much better to establish server connection
    // earlier and so deliver request faster. Now server received requests in C B A order.
    // To ensure that order of requests delivered to the server is right,
    // we should wait for request A round trip, and only then send request B, and so on.
    // Which means request A should be fully done (not just response head received -
    // if response corrupted we should retry).
    // Sequential sending will be slower than serveral parallel requests,
    // but I do not see other way for now.
    var requestQueue = new RequestQueue();

    /**
     * Server API methods.
     */
    var apiMethods = {
        getTasks: "/api/getTasks",
        addTask: "/api/addTask",
        updateTask: "/api/updateTask",
        deleteTask: "/api/deleteTask"
    };

    exports.getTasks = function (cb) {
        requestQueue.push({
            url: apiMethods.getTasks,
            tail: true
        }, cb);
    };

    exports.addTask = function (newTask) {
        requestQueue.push({
            url: apiMethods.addTask,
            params: {
                newTask: newTask
            }
        });
    };

    exports.updateTask = function (taskId, properties) {
        requestQueue.push({
            url: apiMethods.updateTask,
            params: {
                taskId: taskId,
                properties: properties
            }
        });
    };

    exports.deleteTask = function (taskId) {
        requestQueue.push({
            url: apiMethods.deleteTask,
            params: {
                taskId: taskId
            }
        });
    };

    return exports;
});