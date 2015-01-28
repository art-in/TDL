define(function() {
    var exports = {};
    
    exports.apiMethods = {
        addTask: "/api/addTask",
        deleteTask: "/api/deleteTask",
        updateTask: "/api/updateTask",
        getTasks: "/api/getTasks",
        moveTask: "/api/moveTask"
    };
    
    exports.callServerAPI = function (apiMethod, parameters, callback) {
        var datasourceAddress = apiMethod;
            
        if (parameters) {
            datasourceAddress += "?";
            for (var i = 0; i < parameters.length; i++) {
                datasourceAddress += parameters[i].key + "=" + encodeURIComponent(parameters[i].value);
                   
                if (i != parameters.length - 1) {
                    datasourceAddress += "&";
                }
            }
        }
        
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                var responseData = xhr.responseText;
                console.log("data loaded: " + responseData);
                console.groupEnd();
                if (callback) callback(responseData);
            }
        };
        
        xhr.onerror = function () {
            console.log(xhr.statusText);
            console.groupEnd();
        };
        
        xhr.open("GET", datasourceAddress, true);
        xhr.send(null);
        
        console.groupCollapsed('GET ' + datasourceAddress);
    };
    
    return exports;
});