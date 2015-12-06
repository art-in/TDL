define(['ko', 'moment', 'lib/messageBus', 'viewmodels/TaskViewModel', 'viewmodels/ProjectViewModel'],
    function(ko, moment, messageBus, TaskViewModel, ProjectViewModel) {

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

            // Setup filters

            this.filterPanelShown = ko.observable(false);

            if (!localStorage.taskFilter) {
                var filterDefaults = {
                    showDone: true,
                    showDoneSince: 'week'
                };

                localStorage.taskFilter = JSON.stringify(filterDefaults);
            }

            var filterSettings = JSON.parse(localStorage.taskFilter);

            this.filter = {
                showDone: ko.observable(filterSettings.showDone),
                showDoneSince: ko.observable(filterSettings.showDoneSince)
            };

            this.tasks = ko.computed({
                read: function() {
                    var tasks = this.state.tasks();

                    // Apply filters

                    if (this.filter.showDone()) {
                        tasks = tasks.filter(function(task) {
                            var sinceDate;
                            var sinceType = this.filter.showDoneSince();
                            switch (sinceType) {
                                case 'week':
                                    sinceDate = moment().subtract(1, 'weeks');
                                    break;
                                case 'month':
                                    sinceDate = moment().subtract(1, 'months');
                                    break;
                                case 'year':
                                    sinceDate = moment().subtract(1, 'years');
                                    break;
                                case 'beginning':
                                    break;
                                default:
                                    throw Error('unknown since date');
                            }

                            // get tasks which is undone or done since ...
                            return task.progress() !== 1 ||
                                sinceType === 'beginning' ||
                                (task.progress() === 1 &&
                                task.progressDoneOn() > sinceDate);
                        }.bind(this));
                    } else {
                        tasks = tasks.filter(function(task) {
                            // get tasks which is undone
                            return task.progress() !== 1;
                        }.bind(this));
                    }

                    // Save filter settings
                    localStorage.taskFilter = JSON.stringify({
                        showDone: this.filter.showDone(),
                        showDoneSince: this.filter.showDoneSince()
                    });

                    return tasks;
                }.bind(this)
            });

            this.filter.shownCount = ko.computed({
                read: function() {
                    return this.tasks().length;
                }.bind(this)
            });
            this.filter.totalCount = ko.computed({
                read: function() {
                    return this.state.tasks().length;
                }.bind(this)
            });

            // Set handlers
            messageBus.subscribe('projectsLoaded', onProjectsLoaded.bind(this));
        }
        
        TaskListViewModel.prototype.goProjects = function() {
            messageBus.publish('switchingView', 'projectList');
        };
        
        TaskListViewModel.prototype.toggleAddMode = function() {
            this.filterPanelShown(false);
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
         * @param {HTMLElement} prevTaskNode
         */
        TaskListViewModel.prototype.dragTask = function (taskNode, prevTaskNode) {
            var taskVM = ko.dataFor(taskNode);
            var currentPosition = taskVM.position();

            // calc new position relatively to task afore
            // (necessary because some of tasks can be filtered out)
            var newPosition;
            if (prevTaskNode) {
                var prevTaskVM = ko.dataFor(prevTaskNode);
                var prevTaskPosition = prevTaskVM.position();

                newPosition = prevTaskPosition > currentPosition
                    ? prevTaskPosition
                    : prevTaskPosition + 1;
            } else {
                newPosition = 0;
            }

            // Do nothing if position was not changed.
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

        TaskListViewModel.prototype.toggleFilterPanel = function() {
            this.filterPanelShown(!this.filterPanelShown());
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