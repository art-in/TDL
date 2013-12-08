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

    NewTaskTextBox.onkeydown = NewTaskTextBox_KeyDown;
}

// ---------------------  HANDLERS  -------------------------------------------
function btnAddNewTask_OnClick() {
    var description = NewTaskTextBox.innerHTML;
    addNewTask(description);
    refreshNewTaskField();
}

function btnRemoveTask_OnClick(taskId) {
    deleteTask(taskId);
}

function NewTaskTextBox_KeyDown(e) {

    // 'Return' key handler.
    if (e.keyCode == 13 && !e.ctrlKey) {
        // Behave the same as on 'add' button click.
        btnAddNewTask_OnClick();
    }

    // 'Return + CTRL' keys handler.
    if (e.keyCode == 13 && e.ctrlKey) {
        addNewLine(NewTaskTextBox);
    }
}
// ---------------------  FUNCTIONS -------------------------------------------
function addNewTask(description) {
    logFunctionCall();

    // Validate new task.
    if (!description) {
        alert("Description is empty.");
        return;
    }

    // Pass to server.
    var parameters = [
        {key: 'description', value: description}
    ];
    callServerAPI(API_ADD_TASK, parameters, function () {
        refreshTaskList();
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
            taskInstance.id = "task_" + tasks[i]._id;

            var taskDescription = taskInstance.getElementsByClassName('task-description')[0];
            taskDescription.innerHTML = tasks[i].Description;

            var removeButton = taskInstance.getElementsByClassName('task-remove')[0];
            // Set handler argument through closure.
            removeButton.onclick = (function () {
                var taskId = tasks[i]._id;
                return function () {
                    btnRemoveTask_OnClick(taskId);
                }
            })();

            TaskListContainer.appendChild(taskInstance);
        }
    });
}

function refreshNewTaskField() {
    logFunctionCall();
    NewTaskTextBox.innerHTML = '';
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

function addNewLine(node) {
    // Adding two br-tags, in chrome it works like:
    // first intended to finish current line, second - to initiate new line.
    // When start typing, second br-tag will be replaced with entered text.
    node.innerHTML += "<br><br>";
    placeCaretAtEnd(node);
}

function placeCaretAtEnd(el) {
    // Solution for content editable divs from here:
    // http://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
    el.focus();
    if (typeof window.getSelection != "undefined"
        && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
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