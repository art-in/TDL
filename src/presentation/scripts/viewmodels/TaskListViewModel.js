define(['ko', 'lib/helpers', 'lib/transport', 'viewmodels/TaskViewModel'],
    function(ko, helpers, transport, TaskViewModel) {
    
    return function() {
        this.tasks = ko.observableArray([]);
    
        this.newTaskDescription = ko.observable('');
    
        var self = this;
    
        // ---------------------------------
        // Loads tasks from server.
        this.reloadTasks = function () {
            transport.callServerAPI(transport.apiMethods.getTasks, null, function (taskModelsJson) {
                var tasks = self.toViewModels(taskModelsJson);
                self.tasks(tasks);
            });
        };
    
        // ---------------------------------
        // Removes tasks.
        this.removeTask = function (task) {
            self.tasks.remove(task);
    
            var parameters = [
                {key: 'taskId', value: task.id()}
            ];
            transport.callServerAPI(transport.apiMethods.deleteTask, parameters);
        };
    
        // ---------------------------------
        // Adds new task.
        this.addTask = function () {
            var description = self.newTaskDescription();
    
            // Validate new task.
            if (!description) {
                alert("Description is empty.");
                return;
            }
        
            self.newTaskDescription('');
            
            // Pass to server.
            var parameters = [
                {key: 'description', value: description}
            ];
            transport.callServerAPI(transport.apiMethods.addTask, parameters, function (taskModel) {
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
                self.moveTask(task.id(), newPosition);
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
                self.moveTask(task.id(), newPosition);
            }
        };
        
        // ---------------------------------
        // Converts task models JSON to TaskViewModel objects.
        this.toViewModels = function (taskModelsJson) {
            var taskModels = JSON.parse(taskModelsJson);
            var taskViewModels = [];
            taskModels.forEach(function (model) {
                taskViewModels.push(new TaskViewModel(model));
            });
            return taskViewModels;
        };
        
        // ---------------------------------
        // Moves task to new position.
        this.moveTask = function (taskId, newPosition) {
            var parameters = [
                {key: 'taskId', value: taskId},
                {key: 'position', value: newPosition}
            ];
    
            transport.callServerAPI(transport.apiMethods.moveTask, parameters);
        };
        
        // ---------------------------------
        // Moves task to new position.
        this.dragTask = function (taskNode, newPosition) {
            var task = ko.dataFor(taskNode);
            
            var oldPosition = self.tasks().indexOf(task);
            helpers.arrayMoveItem.apply(self.tasks(), [oldPosition, newPosition]);
            
            self.moveTask(task.id(), newPosition);
        };
    };
});