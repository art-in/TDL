/** The gate between business and view-model layers. */
define(['business/business', 'lib/messageBus', 'mappers/viewModelMapper'],
    function(business, messageBus, vmMapper) {
    
    /** View model data state (tasks, projects) */
    var vmState;
    
    //region Public
    
    function setupHandlers(state) {
        if (state === undefined) 
            { throw new Error('View model state is not defined'); }
        
        vmState = state;
        
        messageBus.subscribe('loadingState', onLoadingState);
        
        messageBus.subscribe('addingTask', onAddingTask);
        messageBus.subscribe('updatingTask', onUpdatingTask);
        messageBus.subscribe('movingTask', onMovingTask);
        messageBus.subscribe('deletingTask', onDeletingTask);
        
        messageBus.subscribe('addingProject', onAddingProject);
        messageBus.subscribe('updatingProject', onUpdatingProject);
        messageBus.subscribe('deletingProject', onDeletingProject);
    }
    
    //endregion
    
    //region Handlers
    
    function onLoadingState() {
        var projectVMs;
        business.getProjects(function(error, projects) {
            projectVMs = vmMapper.mapProjects(projects);
            vmState.projects(projectVMs);
            messageBus.publish('projectsLoaded');
        }.bind(this));
        
        business.getTasks(function(error, tasks) {
           updateTasksInState(tasks);
        }.bind(this));
    }
    
    function onAddingTask(data) {
        business.addTask(data.description, data.projectId, function(error, tasks) {
            updateTasksInState(tasks);
        });
    }
    
    function onUpdatingTask(data) {
        business.updateTask(data.id, data.properties, function(error, tasks) {
            updateTasksInState(tasks);
        });
    }
    
    function onMovingTask(data) {
        business.moveTask(data.id, data.position, function(error, tasks) {
            updateTasksInState(tasks);
        });
    }
    
    function onDeletingTask(data) {
        business.deleteTask(data.id, function(error, tasks) {
            updateTasksInState(tasks);
        });
    }
    
    function onAddingProject(data) {
        business.addProject(data.name, data.tags, data.color, function(error, projects) {
            updateProjectsInState(projects);
        });
    }
    
    function onUpdatingProject(data) {
        business.updateProject(data.id, data.properties, function(error, projects) {
            updateProjectsInState(projects);
        });
    }
    
    function onDeletingProject(data) {
        business.deleteProject(data.id, function(error, projects) {
            updateProjectsInState(projects);
        });
    }
    
    //endregion
    
    //region Private
    
    function updateTasksInState(tasks) {
        var taskVMs = vmMapper.mapTasks(tasks, vmState.projects());
        taskVMs.forEach(function(taskVM) { taskVM.state = vmState; });
        vmState.tasks(taskVMs);
    }
    
    function updateProjectsInState(projects) {
        var projectVMs = vmMapper.mapProjects(projects);
        projectVMs.forEach(function(projectVM) { projectVM.state = vmState; });
        vmState.projects(projectVMs);
        vmMapper.assignProjectsToTasks(vmState.tasks(), vmState.projects());
    }
    
    //endregion
    
    return {
        setupHandlers: setupHandlers
    };
});