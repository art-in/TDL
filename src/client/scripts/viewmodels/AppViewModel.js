/** Root view model */
define(['ko', 
        'lib/messageBus', 
        'viewmodels/TaskListViewModel', 
        'viewmodels/ProjectListViewModel'],
    function(ko, 
             messageBus,
             TaskListVM, 
             ProjectListVM) {
       
        function AppViewModel() {
            // View model data state
            this.state = {
                tasks: ko.observableArray([]),
                projects: ko.observableArray([])
            };
            
            // Child views
            this.views = {
                taskList: new TaskListVM(this.state),
                projectList: new ProjectListVM(this.state)
            };
            
            // Default view
            this.views.taskList.active(true);
            
            // Subscribe events
            messageBus.subscribe('switchingView', switchingView.bind(this));
        }
        
        //region Functions
        
        function setCurrentView(view) {
            // Deactivate all others first
            for(var v in this.views) {
                this.views[v].active(false);
            }
            
            view.active(true);
        }
        
        //endregion
        
        //region Handlers
        
        function switchingView(viewName) {
            switch (viewName) {
                case 'taskList': 
                    setCurrentView.call(this, this.views.taskList);
                    break;
                case 'projectList':
                    setCurrentView.call(this, this.views.projectList);
                    break;
                
                default: throw Error('Unknown view to switch to: ' + viewName);
            }
        }
        
        //endregion
        
        return AppViewModel;
    });
