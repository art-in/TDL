// ---------------------  CONSTANTS  -------------------------------------------
var API_ADD_TASK = "/api/addTask";
var API_DELETE_TASK = "/api/deleteTask"
var API_GET_TASKS = "/api/getTasks";
var API_MOVE_TASK = "/api/moveTask";
var API_SET_TASK_PROGRESS = "/api/setTaskProgress";

var CSS_CLASS_NEW_TASK_TEXTBOX = "new-task-input";
var CSS_CLASS_NEW_TASK_ADD_BUTTON = "add-new-task-button";
var CSS_CLASS_TASK = "task";
var CSS_CLASS_TASK_LIST = "task-list";
var CSS_CLASS_TASK_DESCRIPTION = "task-description";
var CSS_CLASS_TASK_REMOVE_BUTTON = "task-remove-button";

var CSS_CLASS_TASK_DRAG_HANDLE = "task-drag-handle";
var CSS_CLASS_TASK_SHIFT_UP_BUTTON = "task-shift-up-button";
var CSS_CLASS_TASK_SHIFT_DOWN_BUTTON = "task-shift-down-button";

var CSS_CLASS_TASK_PROGRESS = "task-progress";
var CSS_CLASS_TASK_PROGRESS_CHECKBOX = "task-progress-checkbox";
// --------------------- VARIABLES ---------------------------------------------
var NewTaskTextBox;
var TaskListContainer;
var XHR;
// ---------------------  INIT  ------------------------------------------------
window.onload = function () {
    setupBindings();
    installControlHandlers();
    makeTaskListDraggable();

    taskListViewModel = new TaskListViewModel();
    ko.applyBindings(taskListViewModel);

    taskListViewModel.reloadTasks();
};

// Setup KO bindings.
function setupBindings() {
    logFunctionCall();

    $('.' + CSS_CLASS_NEW_TASK_TEXTBOX).dataBind({ event: { "'keydown'": '$root.newTaskChanged' }});
    $('.' + CSS_CLASS_NEW_TASK_ADD_BUTTON).dataBind({ click: '$root.addTask' });
    $('.' + CSS_CLASS_TASK_LIST).dataBind({ foreach: '$root.Tasks' });
    $('.' + CSS_CLASS_TASK_SHIFT_UP_BUTTON).dataBind({ click: '$root.shiftTaskUp' });
    $('.' + CSS_CLASS_TASK_SHIFT_DOWN_BUTTON).dataBind({ click: '$root.shiftTaskDown' });
    $('.' + CSS_CLASS_TASK_REMOVE_BUTTON).dataBind({ click: '$root.removeTask' });

    $('.' + CSS_CLASS_TASK_PROGRESS).dataBind({ css: { "'task-progress-checkbox-checked'": '$data.ProgressDone' }});
    $('.' + CSS_CLASS_TASK_PROGRESS_CHECKBOX).dataBind({ checked: '$data.ProgressDone' });
    $('.' + CSS_CLASS_TASK_DESCRIPTION).dataBind({ html: '$data.Description',
                                                   projectAssignment:
                                                       "{ Description: $data.Description, " +
                                                       "  Tags: [{ Tag: '[com]', Color: '#C4F2EA' }," +
                                                       "         { Tag: '[c]', Color: '#FFE1B7' }," +
                                                       "         { Tag: '[s]', Color: '#C1F2C1' }]," +
                                                       "  DefaultTag:   '[com]'}" });
}

// Install control handlers.
function installControlHandlers() {
    logFunctionCall();

    NewTaskTextBox = document.getElementsByClassName(CSS_CLASS_NEW_TASK_TEXTBOX)[0];
    TaskListContainer = document.getElementById("cntTaskList");
}

function makeTaskListDraggable() {
    new Sortable(TaskListContainer, {
        group: "tasks",
        handle: "." + CSS_CLASS_TASK_DRAG_HANDLE,     // Restricts sort start click/touch to the specified element
        draggable: "." + CSS_CLASS_TASK,   // Specifies which items inside the element should be sortable
        onUpdate: TaskList_ItemMoved,
        ghostClass: "task-drag-ghost"
    });
}
// ---------------------  VIEW MODELS -----------------------------------------
var taskListViewModel;

var TaskViewModel = function (task) {
    this.Id = ko.observable(null);
    this.Description = ko.observable(null);
    this.Progress = ko.observable(null);

    if (task) {
        this.Id(task._id);
        this.Description(task.Description);
        this.Progress(task.Progress);
    }

    var self = this;

    //noinspection JSUnresolvedFunction
    this.ProgressDone = ko.computed(
        {
            read: function () {
                return self.Progress() == 1
            },
            write: function (checked) {
                logFunctionCall();

                self.Progress(checked ? 1 : 0);

                var parameters = [
                    {key: 'taskId', value: self.Id()},
                    {key: 'progress', value: self.Progress()}
                ];

                callServerAPI(API_SET_TASK_PROGRESS, parameters, function () {
                });
            }
        });
}

var TaskListViewModel = function () {
    this.Tasks = ko.observableArray([]);

    var self = this;

    // ---------------------------------
    // Loads tasks from server.
    this.reloadTasks = function () {
        logFunctionCall();

        callServerAPI(API_GET_TASKS, null, function (taskModelsJson) {
            var tasks = toViewModels(taskModelsJson);
            taskListViewModel.Tasks(tasks);
        });
    }

    // ---------------------------------
    // Removes tasks.
    this.removeTask = function (task) {
        logFunctionCall();

        self.Tasks.remove(task);

        var parameters = [
            {key: 'taskId', value: task.Id()}
        ];
        callServerAPI(API_DELETE_TASK, parameters, function () {
        });
    }

    // ---------------------------------
    // Adds new task.
    this.addTask = function () {
        logFunctionCall();

        var description = NewTaskTextBox.innerHTML;

        // Validate new task.
        if (!description) {
            alert("Description is empty.");
            return;
        }

        refreshNewTaskField();

        // Pass to server.
        var parameters = [
            {key: 'description', value: description}
        ];
        callServerAPI(API_ADD_TASK, parameters, function (taskModel) {
            var task = new TaskViewModel(JSON.parse(taskModel));
            self.Tasks.unshift(task);
        });
    }

    // ---------------------------------
    // Shifts task one position up.
    this.shiftTaskUp = function (task) {
        var currentPosition = self.Tasks.indexOf(task);
        var newPosition = currentPosition - 1;
        if (newPosition >= 0) {
            logFunctionCall();

            var array = self.Tasks();
            self.Tasks.splice(newPosition, 2, array[currentPosition], array[newPosition]);
            moveTask(task.Id(), newPosition);
        }
    }

    // ---------------------------------
    // Shifts task one position down.
    this.shiftTaskDown = function (task) {
        var currentPosition = self.Tasks.indexOf(task);
        var newPosition = currentPosition + 1;
        if (newPosition < self.Tasks().length) {
            logFunctionCall();

            var array = self.Tasks();
            self.Tasks.splice(currentPosition, 2, array[newPosition], array[currentPosition]);
            moveTask(task.Id(), newPosition);
        }
    }

    // ---------------------------------
    // Handles new task input changed event.
    this.newTaskChanged = function (data, e) {
        // 'Return' key handler.
        if (e.keyCode == 13 && !e.ctrlKey) {
            // Behave the same as on 'add' button click.
            taskListViewModel.addTask();
        }

        // 'Return + CTRL' keys handler.
        if (e.keyCode == 13 && e.ctrlKey) {
            addNewLine(NewTaskTextBox);
        }

        return true;
    }
}
// ---------------------  HANDLERS  -------------------------------------------
function TaskList_ItemMoved(e) {
    var taskNode = e.detail;

    var task = ko.dataFor(taskNode);

    var oldPosition = taskListViewModel.Tasks().indexOf(task);
    var newPosition = getChildNodeIndex(TaskListContainer, taskNode, CSS_CLASS_TASK);

    // Update position in view model.
    taskListViewModel.Tasks().move(oldPosition, newPosition);

    moveTask(task.Id(), newPosition);
}

Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};
// ---------------------  FUNCTIONS -------------------------------------------
function moveTask(taskId, newPosition) {
    var parameters = [
        {key: 'taskId', value: taskId},
        {key: 'position', value: newPosition}
    ];

    callServerAPI(API_MOVE_TASK, parameters, function () {
    });
}

function refreshNewTaskField() {
    logFunctionCall();
    NewTaskTextBox.innerHTML = '';
}
// ---------------------  MAPPERS -------------------------------------------
// Converts JSON list of Task models to list of view models.
function toViewModels(taskModelsJson) {
    var taskModels = JSON.parse(taskModelsJson);
    var taskViewModels = [];
    taskModels.forEach(function (model) {
        taskViewModels.push(new TaskViewModel(model))
    });
    return taskViewModels;
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

function getChildNodeIndex(container, childNode, childCssClass) {
    return Array.prototype.indexOf.call(
        Array.prototype.slice.call(container.childNodes)
            .filter(
            function (node) {
                if (node.classList) {
                    return node.classList.contains(childCssClass)
                }
                return false;
            }), childNode);
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