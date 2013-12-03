// ---------------------  CONSTANTS  -------------------------------------------
var API_ADD_TASK = "/api/addTask";
var API_DELETE_TASK = "/api/deleteTask"
var API_GET_TASKS = "/api/getTasks";
// --------------------- VARIABLES ---------------------------------------------
var NewTaskTextBox;
var TaskTemplate;
var TaskListContainer;
var XHR;
// ---------------------  INIT  ------------------------------------------------
// Install control handlers.
window.onload = function () {
    installControlHandlers();
    refreshTaskList();
};

function installControlHandlers() {
    logFunctionCall();

    document.getElementById("btnAddNewTask").onclick = btnAddNewTask_OnClick;
    NewTaskTextBox = document.getElementById("tbNewTask");
    TaskTemplate = document.getElementById("tmpTask");
    TaskListContainer = document.getElementById("cntTaskList");
}

// ---------------------  HANDLERS  -------------------------------------------
function btnAddNewTask_OnClick() {
    var description = NewTaskTextBox.innerHTML;
    addNewTask(description);
}

function btnRemoveTask_OnClick(taskId) {
    deleteTask(taskId);
}

// TODO: remove button handler.

// ---------------------  FUNCTIONS -------------------------------------------
function addNewTask(description) {
    logFunctionCall();

    var parameters = [
        {key: 'description', value: description}
    ];
    callServerAPI(API_ADD_TASK, parameters, function () {
        refreshTaskList()
    });
}

function deleteTask(taskId) {
    logFunctionCall();

    var parameters = [
        {key: 'taskId', value: taskId}
    ];
    callServerAPI(API_DELETE_TASK, parameters, function () {
        refreshTaskList();
    });
}

function refreshTaskList() {
    logFunctionCall();

    callServerAPI(API_GET_TASKS, null, function (data) {
        // Clear list container.
        clearNode(TaskListContainer);

        // Get tasks and generate layout element for each in tasks list.
        var tasks = JSON.parse(data);
        for (var i = 0; i < tasks.length; i++) {
            var taskInstance = TaskTemplate.cloneNode(true);
            taskInstance.id = "task_" + tasks[i].Id;

            var taskDescription = taskInstance.getElementsByClassName('task-description')[0];
            taskDescription.innerHTML = tasks[i].Description;

            var removeButton = taskInstance.getElementsByClassName('task-remove')[0];
            // Set handler argument through closure.
            removeButton.onclick = (function () {
                var taskId = tasks[i].Id;
                return function () {
                    btnRemoveTask_OnClick(taskId);
                }
            })();

            TaskListContainer.appendChild(taskInstance);
        }
    });
}
// ---------------------  HELPERS -------------------------------------------
function logFunctionCall() {
    var callerName = arguments.callee.caller.name;
    var callerArgs = Array.prototype.slice.call(arguments.callee.caller.arguments, 0);

    var args = [];
    for (var i = 0; i < callerArgs.length; i++) {
        if (isFunction(callerArgs[i])) {
            args.push("('[object Function]')");
        }
        else {
            args.push("('" + callerArgs[i] + "')");
        }
    }

    if (args.length > 0) {
        console.log("--> " + callerName + "(" + args.join(", ") + ")");
    }
    else {
        console.log("--> " + callerName + "()")
    }
}

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function clearNode(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

// ---------------------  TRANSPORT  -------------------------------------------
function callServerAPI(apiMethod, parameters, callback) {
    logFunctionCall();

    var datasourceAddress = apiMethod;

    if (parameters) {
        datasourceAddress += "?";
        for (var i = 0; i < parameters.length; i++) {
            datasourceAddress += parameters[i].key + "=" + parameters[i].value;

            if (i != parameters.length - 1) {
                datasourceAddress += "&";
            }
        }
    }

    XHR = new XMLHttpRequest();
    XHR.onreadystatechange = function () {
        if (XHR.readyState == 4) {
            var responseData = XHR.responseText;
            console.log("data loaded: " + responseData);
            callback(responseData);
        }
    };

    XHR.onerror = function () {
        console.log(XHR.statusText);
    };

    XHR.open("GET", datasourceAddress, true);
    XHR.send(null);

    console.log('GET ' + datasourceAddress);
}
// -----------------------------------------------------------------------------