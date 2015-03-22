define(['ko', 'lib/helpers', 'business/taskManager', 'viewmodels/TaskViewModel'],
    function(ko, helpers, taskManager, TaskViewModel) {

        /**
         * Task list view model.
         *
         * @constructor
         */
        function TaskListViewModel() {
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
         * Updates list from storage.
         */
        TaskListViewModel.prototype.update = function () {
            var tasks = taskManager.getTasks(updateTasks.bind(this));

            updateTasks.call(this, tasks);
        };

        /**
         * Removes tasks.
         *
         * @param {TaskViewModel} taskVM
         */
        TaskListViewModel.prototype.removeTask = function (taskVM) {
            var tasks = taskManager.deleteTask(taskVM.id());

            updateTasks.call(this, tasks);
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

            this.emptyNewTask();

            var tasks = taskManager.addTask(description);

            updateTasks.call(this, tasks);
        };

        TaskListViewModel.prototype.emptyNewTask = function () {
            this.newTaskDescription('');
        };

        /**
         * Shifts task one position up.
         *
         * @param {TaskViewModel} taskVM
         */
        TaskListViewModel.prototype.shiftTaskUp = function (taskVM) {
            var currentPosition = this.tasks.indexOf(taskVM);
            var newPosition = currentPosition - 1;
            if (newPosition >= 0) {
                var tasks = taskManager.moveTask(taskVM.id(), newPosition);
                updateTasks.call(this, tasks);
            }
        };

        /**
         * Shifts task one position down.
         *
         * @param {TaskViewModel} taskVM
         */
        TaskListViewModel.prototype.shiftTaskDown = function (taskVM) {
            var currentPosition = this.tasks.indexOf(taskVM);
            var newPosition = currentPosition + 1;
            if (newPosition < this.tasks().length) {
                var tasks = taskManager.moveTask(taskVM.id(), newPosition);
                updateTasks.call(this, tasks);
            }
        };

        /**
         * Moves task to new position.
         *
         * @param {HTMLElement} taskNode
         * @param {number} newPosition
         */
        TaskListViewModel.prototype.dragTask = function (taskNode, newPosition) {
            var taskVM = ko.dataFor(taskNode);

            var tasks = taskManager.moveTask(taskVM.id(), newPosition);

            // FIXME: dirty hack
            // After we messed up with DOM manually
            // by dragging element to another position,
            // knockout (the cheif of the DOM) got confused,
            // and loses reference to this element. So even
            // if we would re-assign tasks to another array (or .removeAll()),
            // the dragged element will stay in the DOM.
            // Let's clean container directly for now.
            this.tasks.removeAll();
            $('.task-list').empty();

            updateTasks.call(this, tasks);
        };

        /**
         * Updates task list.
         * @param {Task[]} tasks - task models.
         */
        function updateTasks(tasks) {
            var taskVMs = tasks.map(function (task) {
                return new TaskViewModel(task);
            });

            // TODO: check for differences smartly

            this.tasks(taskVMs);
        }

        return TaskListViewModel;
    });