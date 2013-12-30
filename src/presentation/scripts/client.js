// ---------------------  CONSTANTS  -------------------------------------------
var API_ADD_TASK = "/api/addTask";
var API_DELETE_TASK = "/api/deleteTask"
var API_GET_TASKS = "/api/getTasks";
var API_MOVE_TASK = "/api/moveTask";
var API_SET_TASK_PROGRESS = "/api/setTaskProgress";

var TASK_ID_ATTRIBUTE = "data-task-id";

var TASK_CSS_CLASS = "task";
var TASK_DESCRIPTION_CSS_CLASS = "task-description";
var TASK_REMOVE_BUTTON_CSS_CLASS = "task-remove-button";

var TASK_DRAG_HANDLE_CSS_CLASS = "task-drag-handle";
var TASK_SHIFT_UP_BUTTON_CSS_CLASS = "task-shift-up-button";
var TASK_SHIFT_DOWN_BUTTON_CSS_CLASS = "task-shift-down-button";

var TASK_PROGRESS_CSS_CLASS = "task-progress";
var TASK_PROGRESS_CHECKBOX_CSS_CLASS = "task-progress-checkbox";
var TASK_PROGRESS_CHECKBOX_CHECKED_CSS_CLASS = "task-progress-checkbox-checked";
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
    makeTaskListSortable();
};

function installControlHandlers() {
    logFunctionCall();

    document.getElementById("btnAddNewTask").onclick = btnAddNewTask_OnClick;
    NewTaskTextBox = document.getElementById("tbNewTask");
    TaskTemplate = document.getElementById("tmpTask");
    TaskListContainer = document.getElementById("cntTaskList");

    NewTaskTextBox.onkeydown = NewTaskTextBox_KeyDown;
}

function makeTaskListSortable() {
    new Sortable(TaskListContainer, {
        group: "tasks",
        handle: "." + TASK_DRAG_HANDLE_CSS_CLASS,     // Restricts sort start click/touch to the specified element
        draggable: "." + TASK_CSS_CLASS,   // Specifies which items inside the element should be sortable
        onUpdate: TaskList_ItemMoved,
        ghostClass: "task-drag-ghost"
    });
}

// ---------------------  HANDLERS  -------------------------------------------
function btnAddNewTask_OnClick() {
    var description = NewTaskTextBox.innerHTML;
    addNewTask(description);
    refreshNewTaskField();
}

function btnRemoveTask_OnClick(e) {
    var taskNode = getFirstParentByClass(e.target, TASK_CSS_CLASS);
    var taskId = taskNode.getAttribute(TASK_ID_ATTRIBUTE);

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

function btnShiftTaskUp_Click(e) {
    var taskNode = getFirstParentByClass(e.target, TASK_CSS_CLASS);
    var taskId = taskNode.getAttribute(TASK_ID_ATTRIBUTE);

    if (shiftTaskNode(taskNode, false)) {
        var taskPosition = Array.prototype.indexOf.call(TaskListContainer.childNodes, taskNode);
        moveTask(taskId, taskPosition);
    }
}

function btnShiftTaskDown_Click(e) {
    var taskNode = getFirstParentByClass(e.target, TASK_CSS_CLASS);
    var taskId = taskNode.getAttribute(TASK_ID_ATTRIBUTE);

    if (shiftTaskNode(taskNode, true)) {
        var taskPosition = Array.prototype.indexOf.call(TaskListContainer.childNodes, taskNode);
        moveTask(taskId, taskPosition);
    }
}

function TaskList_ItemMoved(e) {
    var taskNode = e.detail;

    var taskId = taskNode.getAttribute(TASK_ID_ATTRIBUTE);
    var taskPosition = Array.prototype.indexOf.call(TaskListContainer.childNodes, taskNode);

    moveTask(taskId, taskPosition);
}

function chbTaskProgress_Change(e) {
    var taskNode = getFirstParentByClass(e.target, TASK_CSS_CLASS);
    var taskId = taskNode.getAttribute(TASK_ID_ATTRIBUTE);
    var taskChecked = e.target.checked;

    // Set background color for progress container.
    var taskProgressContainer = getFirstParentByClass(e.target, TASK_PROGRESS_CSS_CLASS);
    if (taskChecked) {
        taskProgressContainer.classList.add(TASK_PROGRESS_CHECKBOX_CHECKED_CSS_CLASS);
    } else {
        taskProgressContainer.classList.remove(TASK_PROGRESS_CHECKBOX_CHECKED_CSS_CLASS);
    }

    setTaskProgress(taskId, taskChecked ? 1 : 0);
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

function shiftTaskNode(taskNode, isDown) {
    // Swap two close nodes.
    var nearTaskNode = isDown ? taskNode.nextSibling : taskNode.previousSibling;
    if (nearTaskNode) {
        taskNode.parentNode.insertBefore(
            isDown ? nearTaskNode : taskNode,
            isDown ? taskNode : nearTaskNode);
        return true;
    }
    else {
        return false;
    }
}

function moveTask(taskId, newPosition) {
    logFunctionCall();

    var parameters = [
        {key: 'taskId', value: taskId},
        {key: 'position', value: newPosition}
    ];

    callServerAPI(API_MOVE_TASK, parameters, function () {
    });
}

function setTaskProgress(taskId, progress) {
    logFunctionCall();

    var parameters = [
        {key: 'taskId', value: taskId},
        {key: 'progress', value: progress}
    ];

    callServerAPI(API_SET_TASK_PROGRESS, parameters, function () {
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

            // Initialize elements in new task node.
            taskInstance.id = "task_" + i;
            taskInstance.setAttribute(TASK_ID_ATTRIBUTE, tasks[i]._id);

            // Description.
            var taskDescription = taskInstance.getElementsByClassName(TASK_DESCRIPTION_CSS_CLASS)[0];
            taskDescription.innerHTML = tasks[i].Description;

            // Remove button.
            var removeButton = taskInstance.getElementsByClassName(TASK_REMOVE_BUTTON_CSS_CLASS)[0];
            removeButton.onclick = btnRemoveTask_OnClick;

            // Shift buttons.
            var taskShiftUpButton = taskInstance.getElementsByClassName(TASK_SHIFT_UP_BUTTON_CSS_CLASS)[0];
            var taskShiftDownButton = taskInstance.getElementsByClassName(TASK_SHIFT_DOWN_BUTTON_CSS_CLASS)[0];

            taskShiftUpButton.onclick = btnShiftTaskUp_Click;
            taskShiftDownButton.onclick = btnShiftTaskDown_Click;

            // Progress indicator.
            var taskProgressContainer = taskInstance.getElementsByClassName(TASK_PROGRESS_CSS_CLASS)[0];
            var taskProgressCheckbox = taskInstance.getElementsByClassName(TASK_PROGRESS_CHECKBOX_CSS_CLASS)[0];

            if (tasks[i].Progress) {
                taskProgressCheckbox.checked = true;
                taskProgressContainer.classList.add(TASK_PROGRESS_CHECKBOX_CHECKED_CSS_CLASS);
            }

            taskProgressCheckbox.onchange = chbTaskProgress_Change;

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


// Gets first (closest) parent by CSS class.
// Returns: HTML node, or null if no parent with such class.
function getFirstParentByClass(element, className) {
    var p = element.parentNode;
    while (p != null) {
        if (p.classList.contains(className)) {
            return p;
        }
        else {
            p = p.parentNode;
        }
    }
}

// ---------------------  TRANSPORT  -------------------------------------------
function callServerAPI(apiMethod, parameters, callback) {
    logFunctionCall();

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