/** The gate between business and view-model layers. */
define(['business/business', 'lib/messageBus', 'mappers/viewModelMapper'],
    function(business, messageBus, mapper) {
    
    /** View model data state (tasks, projects) */
    var vmState;
    
    //region Public
    
    function setupHandlers(state) {
        if (state === undefined) 
            { throw new Error('View model state is not defined'); }
        
        vmState = state;
        
        messageBus.subscribe('loading', onLoading);
        
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
    
    function onLoading() {
        Promise.race([
            loadLocalState(),
            loadServerState()
        ])
        .then(messageBus.publish.bind(messageBus, 'projectsLoaded'));
    }
    
    function onAddingTask(data) {
        business
            .addTask(data.description, data.projectId)
            .then(loadLocalState);
    }
    
    function onUpdatingTask(data) {
        business
            .updateTask(data.id, data.properties)
            .then(loadLocalState);
    }
    
    function onMovingTask(data) {
        business
            .moveTask(data.id, data.position)
            .then(loadLocalState);
    }
    
    function onDeletingTask(data) {
        business
            .deleteTask(data.id)
            .then(loadLocalState);
    }
    
    function onAddingProject(data) {
        business
            .addProject(data.name, data.tags, data.color)
            .then(loadLocalState);
    }
    
    function onUpdatingProject(data) {
        business
            .updateProject(data.id, data.properties)
            .then(loadLocalState);
    }
    
    function onDeletingProject(data) {
        business
            .deleteProject(data.id)
            .then(loadLocalState);
    }
    
    //endregion
    
    //region Private
    
    function updateProjectsInState(projects) {
        var projectVMs = mapper.mapProjects(projects);
        projectVMs.forEach(function(projectVM) { projectVM.state = vmState; });
        vmState.projects(projectVMs);
        mapper.assignProjectsToTasks(vmState.tasks(), vmState.projects());
    }
    
    function updateTasksInState(tasks) {
        var taskVMs = mapper.mapTasks(tasks, vmState.projects());
        taskVMs.forEach(function(taskVM) { taskVM.state = vmState; });
        vmState.tasks(taskVMs);
    }
    
    function loadLocalState() {
        return Promise.all([
            business.getProjects().local().then(updateProjectsInState),
            business.getTasks().local().then(updateTasksInState)
        ]);
    }
    
    function loadServerState() {
        return Promise.all([
            business.getProjects().server().then(updateProjectsInState),
            business.getTasks().server().then(updateTasksInState)
        ]);
    }
    
    //endregion
    
    return {
        setupHandlers: setupHandlers
    };
});