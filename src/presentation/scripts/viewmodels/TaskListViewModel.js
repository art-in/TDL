define(['ko', 'lib/helpers', 'lib/transport', 'viewmodels/TaskViewModel'],
    function(ko, helpers, transport, TaskViewModel) {
    
    /**
     * Task list view model.
     * 
     * @constructor
     */
    function TaskListViewModel () {
        /**
         * List of task view models
         */
        this.tasks = ko.observableArray([]);
        
        /**
         * Description of new-task
         */
        this.newTaskDescription = ko.observable('');
    }
    
    /**
     * Loads tasks from the server.
     */
    TaskListViewModel.prototype.reloadTasks = function () {
        transport.callServerAPI(transport.apiMethods.getTasks, null,
            function (taskModelsJson) {
                var tasks = this.toViewModels(taskModelsJson);
                this.tasks(tasks);
            }.bind(this));
    };

    /**
     * Removes tasks.
     * 
     * @param {TaskViewModel} task
     */
    TaskListViewModel.prototype.removeTask = function (task) {
        this.tasks.remove(task);

        var parameters = [
            {key: 'taskId', value: task.id()}
        ];
        transport.callServerAPI(transport.apiMethods.deleteTask, parameters);
    };

    /**
     * Adds new task with new-task description.
     */
    TaskListViewModel.prototype.addTask = function () {
        var description = this.newTaskDescription();

        // Validate new task.
        if (!description) {
            alert("Description is empty.");
            return;
        }
    
        this.newTaskDescription('');
        
        // Pass to server.
        var parameters = [
            {key: 'description', value: description}
        ];
        transport.callServerAPI(transport.apiMethods.addTask, parameters, 
            function (taskModel) {
                var task = new TaskViewModel(JSON.parse(taskModel));
                this.tasks.unshift(task);
            }.bind(this));
    };

    /**
     * Shifts task one position up.
     * 
     * @param {TaskViewModel} task
     */
    TaskListViewModel.prototype.shiftTaskUp = function (task) {
        var currentPosition = this.tasks.indexOf(task);
        var newPosition = currentPosition - 1;
        if (newPosition >= 0) {
            var array = this.tasks();
            this.tasks.splice(newPosition, 2, array[currentPosition], array[newPosition]);
            this.moveTask(task.id(), newPosition);
        }
    };

    /**
     * Shifts task one position down.
     * 
     * @param {TaskViewModel} task
     */
    TaskListViewModel.prototype.shiftTaskDown = function (task) {
        var currentPosition = this.tasks.indexOf(task);
        var newPosition = currentPosition + 1;
        if (newPosition < this.tasks().length) {
            var array = this.tasks();
            this.tasks.splice(currentPosition, 2, array[newPosition], array[currentPosition]);
            this.moveTask(task.id(), newPosition);
        }
    };
    
    /**
     * Converts task models JSON to TaskViewModel objects.
     * 
     * @param {string} taskModelsJson - JSON of array of task view models.
     */
    TaskListViewModel.prototype.toViewModels = function (taskModelsJson) {
        var taskModels = JSON.parse(taskModelsJson);
        var taskViewModels = [];
        taskModels.forEach(function (model) {
            taskViewModels.push(new TaskViewModel(model));
        });
        return taskViewModels;
    };
    
    /**
     * Moves task to new position.
     * 
     * @param {string} taskId
     * @param {number} newPosition
     */
    TaskListViewModel.prototype.moveTask = function (taskId, newPosition) {
        var parameters = [
            {key: 'taskId', value: taskId},
            {key: 'position', value: newPosition}
        ];

        transport.callServerAPI(transport.apiMethods.moveTask, parameters);
    };
    
    /**
     * Moves task to new position.
     * 
     * @param {HTMLElement} taskNode
     * @param {number} newPosition
     */
    TaskListViewModel.prototype.dragTask = function (taskNode, newPosition) {
        var task = ko.dataFor(taskNode);
        
        var oldPosition = this.tasks().indexOf(task);
        helpers.arrayMoveItem.apply(this.tasks(), [oldPosition, newPosition]);
        
        this.moveTask(task.id(), newPosition);
    };
    
    return TaskListViewModel;
});