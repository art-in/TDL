// ---------------------  CONSTANTS  -------------------------------------------
var API_ADD_TASK = "/api/addTask";
var API_DELETE_TASK = "/api/deleteTask";
var API_UPDATE_TASK = "/api/updateTask";
var API_GET_TASKS = "/api/getTasks";
var API_MOVE_TASK = "/api/moveTask";

var CSS_CLASS_NEW_TASK_TEXTBOX = "new-task-input";
var CSS_CLASS_NEW_TASK_ADD_BUTTON = "add-new-task-button";
var CSS_CLASS_TASK = "task";
var CSS_CLASS_TASK_LIST = "task-list";
var CSS_CLASS_TASK_DESCRIPTION = "task-description";
var CSS_CLASS_TASK_EDIT_BUTTON = "task-edit-button";
var CSS_CLASS_TASK_EDIT_SAVE_BUTTON = "task-edit-save-button";
var CSS_CLASS_TASK_EDIT_CANCEL_BUTTON = "task-edit-cancel-button";
var CSS_CLASS_TASK_REMOVE_BUTTON = "task-remove-button";

var CSS_CLASS_TASK_DRAG_HANDLE = "task-drag-handle";
var CSS_CLASS_TASK_SHIFT = "task-shift";
var CSS_CLASS_TASK_SHIFT_UP_BUTTON = "task-shift-up-button";
var CSS_CLASS_TASK_SHIFT_DOWN_BUTTON = "task-shift-down-button";

var CSS_CLASS_TASK_PROGRESS = "task-progress";
var CSS_CLASS_TASK_PROGRESS_CHECKBOX = "task-progress-checkbox";
// --------------------- VARIABLES ---------------------------------------------
var newTaskTextBox;
var taskListContainer;
var xhr;
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
    $('.' + CSS_CLASS_NEW_TASK_TEXTBOX).dataBind({ returnKeyPress: '$root.addTask' });
    $('.' + CSS_CLASS_NEW_TASK_ADD_BUTTON).dataBind({ click: '$root.addTask' });
    $('.' + CSS_CLASS_TASK_LIST).dataBind({ foreach: '$root.tasks' });
    $('.' + CSS_CLASS_TASK_SHIFT_UP_BUTTON).dataBind({ click: '$root.shiftTaskUp' });
    $('.' + CSS_CLASS_TASK_SHIFT_DOWN_BUTTON).dataBind({ click: '$root.shiftTaskDown' });
    $('.' + CSS_CLASS_TASK_REMOVE_BUTTON).dataBind({ click: '$root.removeTask',
                                                     visible: '!$data.inEditMode()' });

    $('.' + CSS_CLASS_TASK_PROGRESS).dataBind({ css: { "'task-progress-checkbox-checked'": '$data.progressDone' }});
    $('.' + CSS_CLASS_TASK_PROGRESS_CHECKBOX).dataBind({ checked: '$data.progressDone' });
    $('.' + CSS_CLASS_TASK_SHIFT).dataBind({ visible: '!$data.inEditMode()' });
    $('.' + CSS_CLASS_TASK_DRAG_HANDLE).dataBind({ visible: '!$data.inEditMode()'});
    $('.' + CSS_CLASS_TASK_EDIT_BUTTON).dataBind({ click: '$data.toggleEditMode',
                                                   visible: '!$data.inEditMode()' });
    $('.' + CSS_CLASS_TASK_EDIT_SAVE_BUTTON).dataBind({ click: '$data.saveDescription',
                                                        visible: '$data.inEditMode() && $data.description()' });
    $('.' + CSS_CLASS_TASK_EDIT_CANCEL_BUTTON).dataBind({ click: '$data.toggleEditMode',
                                                          visible: '$data.inEditMode' });                                                   
    $('.' + CSS_CLASS_TASK_DESCRIPTION).dataBind({ editableHTML: '$data.description',
                                                   contentEditable: '$data.inEditMode',
                                                   css: { "'editing'": '$data.inEditMode' },
                                                   returnKeyPress: '$data.saveDescription',
                                                   contentSelect: '$data.inEditMode',
                                                   backgroundColorTag:
                                                       "{ source: $data.description, " +
                                                       "  tags: [{ tag: '[com]', color: '#C4F2EA' }," +
                                                       "         { tag: '[c]', color: '#FFE1B7' }," +
                                                       "         { tag: '[s]', color: '#C1F2C1' }]," +
                                                       "  defaultTag:   '[com]'}" });
}

// Install control handlers.
function installControlHandlers() {
    newTaskTextBox = document.getElementsByClassName(CSS_CLASS_NEW_TASK_TEXTBOX)[0];
    taskListContainer = document.getElementById("cntTaskList");
}

function makeTaskListDraggable() {
    new Sortable(taskListContainer, {
        group: "tasks",
        handle: "." + CSS_CLASS_TASK_DRAG_HANDLE,     // Restricts sort start click/touch to the specified element
        draggable: "." + CSS_CLASS_TASK,   // Specifies which items inside the element should be sortable
        onUpdate: taskList_ItemMoved,
        ghostClass: "task-drag-ghost"
    });
}
// ---------------------  VIEW MODELS -----------------------------------------
var taskListViewModel;

var TaskViewModel = function (task) {
    this.id = ko.observable(null);
    this.description = ko.observable(null);
    this.progress = ko.observable(null); // [0;1]

    if (task) {
        this.id(task._id);
        this.description(task.description);
        this.progress(task.progress);
    }

    this.inEditMode = ko.observable(false);

    // Description saved before entering edit mode
    var descriptionBeforeEdit = this.description.peek();

    this.inEditMode.subscribe(function(inEditMode) {
        // Save/restore description before/after editing
        if (inEditMode) {
            descriptionBeforeEdit = self.description.peek();
        } else {
            self.description(descriptionBeforeEdit);
        }
    });

    var self = this;

    this.toggleEditMode = function() {
        self.inEditMode(!self.inEditMode());
    };
    
    this.saveDescription = function() {
        if (self.description() !== descriptionBeforeEdit) {
            var parameters = [
                {key: 'taskId', value: self.id()},
                {key: 'description', value: self.description()}
            ];
        
            callServerAPI(API_UPDATE_TASK, parameters);
            
            descriptionBeforeEdit = self.description.peek();
        }
        
        self.toggleEditMode();
    };

    //noinspection JSUnresolvedFunction
    this.progressDone = ko.computed(
        {
            read: function () {
                return self.progress() == 1;
            },
            write: function (checked) {
                self.progress(checked ? 1 : 0);

                var parameters = [
                    {key: 'taskId', value: self.id()},
                    {key: 'progress', value: self.progress()}
                ];

                callServerAPI(API_UPDATE_TASK, parameters);
            }
        });
};

var TaskListViewModel = function () {
    this.tasks = ko.observableArray([]);

    var self = this;

    // ---------------------------------
    // Loads tasks from server.
    this.reloadTasks = function () {
        callServerAPI(API_GET_TASKS, null, function (taskModelsJson) {
            var tasks = toViewModels(taskModelsJson);
            taskListViewModel.tasks(tasks);
        });
    };

    // ---------------------------------
    // Removes tasks.
    this.removeTask = function (task) {
        self.tasks.remove(task);

        var parameters = [
            {key: 'taskId', value: task.id()}
        ];
        callServerAPI(API_DELETE_TASK, parameters);
    };

    // ---------------------------------
    // Adds new task.
    this.addTask = function () {
        var description = newTaskTextBox.innerHTML;

        // Validate new task.
        if (!description) {
            alert("Description is empty.");
            return;
        }

        newTaskTextBox.innerHTML = '';
        
        // Pass to server.
        var parameters = [
            {key: 'description', value: description}
        ];
        callServerAPI(API_ADD_TASK, parameters, function (taskModel) {
            var task = new TaskViewModel(JSON.parse(taskModel));
            self.tasks.unshift(task);
        });
    };

    // ---------------------------------
    // Shifts task one position up.
    this.shiftTaskUp = function (task) {
        var currentPosition = self.tasks.indexOf(task);
        var newPosition = currentPosition - 1;
        if (newPosition >= 0) {
            var array = self.tasks();
            self.tasks.splice(newPosition, 2, array[currentPosition], array[newPosition]);
            moveTask(task.id(), newPosition);
        }
    };

    // ---------------------------------
    // Shifts task one position down.
    this.shiftTaskDown = function (task) {
        var currentPosition = self.tasks.indexOf(task);
        var newPosition = currentPosition + 1;
        if (newPosition < self.tasks().length) {
            var array = self.tasks();
            self.tasks.splice(currentPosition, 2, array[newPosition], array[currentPosition]);
            moveTask(task.id(), newPosition);
        }
    };
};
// ---------------------  HANDLERS  -------------------------------------------
function taskList_ItemMoved(e) {
    var taskNode = e.item;

    var task = ko.dataFor(taskNode);

    var oldPosition = taskListViewModel.tasks().indexOf(task);
    var newPosition = getChildNodeIndex(taskListContainer, taskNode, CSS_CLASS_TASK);

    // Update position in view model.
    taskListViewModel.tasks().move(oldPosition, newPosition);

    moveTask(task.id(), newPosition);
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

    callServerAPI(API_MOVE_TASK, parameters);
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
function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
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

    xhr = new XMLHttpRequest();
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
}
// -----------------------------------------------------------------------------