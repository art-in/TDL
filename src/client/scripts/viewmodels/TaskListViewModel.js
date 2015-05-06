define(['ko', 'lib/messageBus', 'viewmodels/TaskViewModel', 'viewmodels/ProjectViewModel'],
    function(ko, messageBus, TaskViewModel, ProjectViewModel) {

        /**
         * Task list view model.
         *
         * @constructor
         */
        function TaskListViewModel(state) {
            
            this.state = state;
            
            this.active = ko.observable(false);
            
            /** Description of new task */
            this.newTaskDescription = ko.observable('');
            
            /** Project of new task */
            this.newTaskProject = ko.observable(new ProjectViewModel());
            
            /** Project list for selection */
            this.projectsToSelect = ko.computed({
                read: function() {
                    // Add empty project to tail
                    // Since there is a chance to have no projects defined,
                    // new tasks will have 'null' project anyway. We should 
                    // reflect to that by allowing to set 'null' project explicitly.
                    var projects = (this.state && this.state.projects().slice(0)) || [];
                    var nullProject = new ProjectViewModel();
                    projects.push(nullProject);
                    return projects;
                }.bind(this)
            });
            
            this.inAddMode = ko.observable(false);
            
            messageBus.subscribe('projectsLoaded', onProjectsLoaded.bind(this));
        }
        
        TaskListViewModel.prototype.goProjects = function() {
            messageBus.publish('switchingView', 'projectList');
        };
        
        TaskListViewModel.prototype.toggleAddMode = function() {
            this.emptyNewTask();
            this.inAddMode(!this.inAddMode());
        };
        
        /**
         * Adds new task.
         */
        TaskListViewModel.prototype.addTask = function () {
            var description = this.newTaskDescription();
            var projectId = this.newTaskProject() && this.newTaskProject().id();

            // Validate new task.
            if (!description) {
                alert("Description is empty.");
                return;
            }

            this.emptyNewTask();
            
            messageBus.publish('addingTask', {
                description: description,
                projectId: projectId
            });
            
            this.toggleAddMode();
        };

        TaskListViewModel.prototype.emptyNewTask = function () {
            this.newTaskDescription('');
            this.newTaskProject(this.state.projects()[0] || new ProjectViewModel());
        };

        /**
         * Removes tasks.
         *
         * @param {TaskViewModel} taskVM
         */
        TaskListViewModel.prototype.removeTask = function (taskVM) {
             messageBus.publish('deletingTask', { id: taskVM.id() });
        };

        /**
         * Shifts task one position up.
         *
         * @param {TaskViewModel} taskVM
         */
        TaskListViewModel.prototype.shiftTaskUp = function (taskVM) {
            var currentPosition = this.state.tasks.indexOf(taskVM);
            var newPosition = currentPosition - 1;
            if (newPosition >= 0) {
                messageBus.publish('movingTask', {
                    id: taskVM.id(),
                    position: newPosition
                });
            }
        };

        /**
         * Shifts task one position down.
         *
         * @param {TaskViewModel} taskVM
         */
        TaskListViewModel.prototype.shiftTaskDown = function (taskVM) {
            var currentPosition = this.state.tasks.indexOf(taskVM);
            var newPosition = currentPosition + 1;
            if (newPosition < this.state.tasks().length) {
                messageBus.publish('movingTask', {
                    id: taskVM.id(),
                    position: newPosition
                });
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
            
            // Do nothing if position was not changed.
            var currentPosition = this.state.tasks.indexOf(taskVM);
            if (currentPosition === newPosition) { return; }
            
            // FIXME: dirty hack
            // After we messed up with DOM manually
            // by dragging element to another position,
            // knockout (the Chief of the DOM) got confused,
            // and loses reference to this element. So even
            // if we would re-assign tasks to another array (or .removeAll()),
            // the dragged element will stay in the DOM anyway.
            // Let's clean container directly for now.
            this.state.tasks.removeAll();
            $('.task-list').empty();

            messageBus.publish('movingTask', {
                    id: taskVM.id(),
                    position: newPosition
                });
        };
        
        //region Handlers
        
        function onProjectsLoaded() {
            if (this.state.projects().length > 0) {
                // Set first project as default one for new tasks
                this.newTaskProject(this.state.projects()[0]);
            }
        }
        
        //endregion
        
        return TaskListViewModel;
    });